import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { useAuth } from '../../hooks/useAuth.jsx'
import { useToast } from '../../hooks/useToast.jsx'
import PageWrapper from '../../components/layout/PageWrapper.jsx'
import Modal from '../../components/ui/Modal.jsx'
import { LoadingState } from '../../components/ui/Spinner.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import QuestionRenderer from '../../components/quiz/QuestionRenderer.jsx'
import FlagModal from '../../components/quiz/FlagModal.jsx'
import {
  calculateIsCorrect,
  emptyAnswerFor,
  isAnswered,
  shuffle,
} from '../../utils/scoring.js'

const STAGE = {
  LOADING: 'loading',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  ERROR: 'error',
  LOCKED: 'locked',
}

export default function DomainExam() {
  const { examId, domainId } = useParams()
  const { user } = useAuth()
  const { toast } = useToast()

  const [stage, setStage] = useState(STAGE.LOADING)
  const [error, setError] = useState(null)
  const [domain, setDomain] = useState(null)
  const [los, setLos] = useState([]) // all LOs in domain (for per-LO breakdown)

  const [sessionId, setSessionId] = useState(null)
  const [domainExamSessionId, setDomainExamSessionId] = useState(null)
  const [startedAt, setStartedAt] = useState(null)

  const [questions, setQuestions] = useState([])
  const [questionTypesById, setQuestionTypesById] = useState({})

  const [currentIdx, setCurrentIdx] = useState(0)
  const [answersByQ, setAnswersByQ] = useState({}) // qid → user answer
  const [submitWarn, setSubmitWarn] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [resultsByQ, setResultsByQ] = useState({}) // populated only after submit

  const [flagOpen, setFlagOpen] = useState(false)

  // StrictMode runs effects twice in dev. Without a guard, both invocations
  // race past the "abandon active" check and each insert a fresh session,
  // leaving a dangling active row. NOTE: we deliberately don't pair the
  // ref guard with a "cancelled" flag — under StrictMode the cleanup of
  // the first pass would flip cancelled=true while the ref makes the
  // second pass bail, leaving the start forever stuck mid-flight.
  const startedRef = useRef(false)

  useEffect(() => {
    if (!user) return
    if (startedRef.current) return
    startedRef.current = true
    async function start() {
      try {
        // 1. Verify unlock: every LO in domain must have a completed lo_quiz_session for this user
        const { data: domLos, error: lErr } = await supabase
          .from('los')
          .select('id, code, title, sort_order')
          .eq('domain_id', domainId)
          .order('sort_order')
        if (lErr) throw lErr
        if (!domLos?.length) {
          setError('Domain has no learning objectives.')
          setStage(STAGE.ERROR)
          return
        }
        setLos(domLos)

        const loIds = domLos.map((l) => l.id)
        const { data: doneRows, error: dErr } = await supabase
          .from('lo_quiz_sessions')
          .select('lo_id, sessions!inner(user_id, exam_id)')
          .in('lo_id', loIds)
          .eq('status', 'completed')
          .eq('sessions.user_id', user.id)
          .eq('sessions.exam_id', examId)
        if (dErr) throw dErr
        const completedLoSet = new Set((doneRows ?? []).map((r) => r.lo_id))
        const allDone = loIds.every((id) => completedLoSet.has(id))
        if (!allDone) {
          setStage(STAGE.LOCKED)
          return
        }

        // 2. Domain row
        const { data: dom, error: domErr } = await supabase
          .from('domains')
          .select('id, code, title')
          .eq('id', domainId)
          .single()
        if (domErr) throw domErr
        setDomain(dom)

        // 3. Always abandon any existing active domain_exam_session for this user/domain
        const { data: actives } = await supabase
          .from('domain_exam_sessions')
          .select('id, sessions!inner(user_id, exam_id)')
          .eq('domain_id', domainId)
          .eq('status', 'active')
          .eq('sessions.user_id', user.id)
          .eq('sessions.exam_id', examId)
        if (actives?.length) {
          await supabase
            .from('domain_exam_sessions')
            .update({ status: 'abandoned' })
            .in('id', actives.map((a) => a.id))
        }

        // 4. Create fresh sessions row + domain_exam_sessions row
        const { data: sRow, error: sErr } = await supabase
          .from('sessions')
          .insert({
            user_id: user.id,
            exam_id: examId,
            session_type: 'domain_exam',
          })
          .select()
          .single()
        if (sErr) throw sErr

        const { data: des, error: dxErr } = await supabase
          .from('domain_exam_sessions')
          .insert({
            session_id: sRow.id,
            domain_id: domainId,
            status: 'active',
          })
          .select()
          .single()
        if (dxErr) throw dxErr

        // 5. Load all questions in all LOs
        const { data: qs, error: qErr } = await supabase
          .from('questions')
          .select(
            'id, lo_id, question_type_id, question_text, explanation, difficulty, question_options(*)'
          )
          .in('lo_id', loIds)
          .order('created_at')
        if (qErr) throw qErr

        const { data: qts } = await supabase.from('question_types').select('*')
        const qtMap = {}
        for (const t of qts ?? []) qtMap[t.id] = t

        setSessionId(sRow.id)
        setDomainExamSessionId(des.id)
        setStartedAt(Date.now())
        setQuestionTypesById(qtMap)
        setQuestions(shuffle(qs ?? []))
        setStage(STAGE.ACTIVE)
      } catch (e) {
        setError(e.message)
        setStage(STAGE.ERROR)
      }
    }
    start()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, examId, domainId])

  // ── derived ──────────────────────────────────────────────────
  const current = questions[currentIdx]
  const currentType = current
    ? questionTypesById[current.question_type_id]?.code
    : null
  const total = questions.length
  const answeredCount = useMemo(
    () =>
      questions.filter((q) =>
        isAnswered(
          questionTypesById[q.question_type_id]?.code,
          answersByQ[q.id],
          q.question_options
        )
      ).length,
    [questions, answersByQ, questionTypesById]
  )

  function setAnswerForCurrent(val) {
    if (!current) return
    setAnswersByQ((prev) => ({ ...prev, [current.id]: val }))
  }
  function next() {
    if (currentIdx < total - 1) setCurrentIdx(currentIdx + 1)
  }
  function prev() {
    if (currentIdx > 0) setCurrentIdx(currentIdx - 1)
  }

  function attemptSubmit() {
    if (answeredCount < total) setSubmitWarn(true)
    else submitExam()
  }

  async function submitExam() {
    setSubmitWarn(false)
    setSubmitting(true)
    try {
      // For each question: compute is_correct (skipped = false) then bulk-insert attempts
      const rows = []
      const result = {}
      let correct = 0
      for (const q of questions) {
        const code = questionTypesById[q.question_type_id]?.code
        const ans = answersByQ[q.id]
        const answered = isAnswered(code, ans, q.question_options)
        const is_correct = answered
          ? calculateIsCorrect(code, ans, q.question_options)
          : false
        if (answered) {
          rows.push({
            session_id: sessionId,
            user_id: user.id,
            question_id: q.id,
            question_type_id: q.question_type_id,
            is_correct,
            user_answer: ans,
          })
        }
        result[q.id] = { answered, is_correct }
        if (is_correct) correct++
      }
      if (rows.length > 0) {
        const { error: aErr } = await supabase.from('attempts').insert(rows)
        if (aErr) throw aErr
      }

      const elapsed = startedAt
        ? Math.round((Date.now() - startedAt) / 1000)
        : null
      const { error: upErr } = await supabase
        .from('domain_exam_sessions')
        .update({
          status: 'completed',
          correct_count: correct,
          total_questions: total,
          time_taken_seconds: elapsed,
          completed_at: new Date().toISOString(),
        })
        .eq('id', domainExamSessionId)
      if (upErr) throw upErr

      toast(`Domain exam submitted — ${correct} of ${total} correct.`)
      setResultsByQ(result)
      setStage(STAGE.COMPLETED)
    } catch (e) {
      setError(e.message)
      toast({ tone: 'error', message: `Couldn't submit: ${e.message}` })
      setSubmitting(false)
    }
  }

  // ── render ────────────────────────────────────────────────────
  if (stage === STAGE.LOADING) {
    return (
      <PageWrapper>
        <LoadingState label="Preparing exam…" />
      </PageWrapper>
    )
  }
  if (stage === STAGE.LOCKED) {
    return (
      <PageWrapper>
        <Link to={`/study/${examId}`} className="text-sm text-blue-600 hover:underline">
          ← Study dashboard
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-3">Domain exam locked</h1>
        <p className="text-gray-600 mt-2">
          Complete the practice quiz for every LO in this domain before taking the
          domain exam.
        </p>
      </PageWrapper>
    )
  }
  if (stage === STAGE.ERROR) {
    return (
      <PageWrapper>
        <Link to={`/study/${examId}`} className="text-sm text-blue-600 hover:underline">
          ← Study dashboard
        </Link>
        <p className="text-red-600 mt-4">{error}</p>
      </PageWrapper>
    )
  }
  if (stage === STAGE.COMPLETED) {
    return (
      <DomainExamResults
        examId={examId}
        domain={domain}
        los={los}
        questions={questions}
        questionTypesById={questionTypesById}
        answersByQ={answersByQ}
        resultsByQ={resultsByQ}
      />
    )
  }

  // ACTIVE
  if (questions.length === 0) {
    return (
      <PageWrapper>
        <Link to={`/study/${examId}`} className="text-sm text-blue-600 hover:underline">
          ← Study dashboard
        </Link>
        <div className="mt-6">
          <EmptyState
            title="No questions yet"
            description="This domain doesn't have any questions seeded yet."
          />
        </div>
      </PageWrapper>
    )
  }

  const userAnswer = answersByQ[current.id] ?? emptyAnswerFor(currentType)

  return (
    <PageWrapper>
      <Link to={`/study/${examId}`} className="text-sm text-blue-600 hover:underline">
        ← Study dashboard
      </Link>

      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <span className="text-xs font-mono text-gray-500">
            {domain?.code} · Domain Exam
          </span>
          <h1 className="text-xl font-bold text-gray-900">{domain?.title}</h1>
        </div>
        <div className="text-sm text-gray-500">
          Question {currentIdx + 1} of {total} · {answeredCount} answered ·{' '}
          {total - answeredCount} remaining
        </div>
      </div>

      <div className="mt-2 h-1.5 w-full bg-gray-200 rounded">
        <div
          className="h-1.5 bg-blue-600 rounded transition-all"
          style={{ width: `${(answeredCount / total) * 100}%` }}
        />
      </div>

      <div className="mt-6 bg-white border border-gray-200 rounded-lg p-5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="text-xs uppercase tracking-wide text-gray-500">
            {questionTypesById[current.question_type_id]?.label}
          </div>
          <button
            onClick={() => setFlagOpen(true)}
            title="Report this question"
            className="text-xs text-gray-400 hover:text-red-600 flex items-center gap-1"
          >
            <span aria-hidden>⚑</span> Report
          </button>
        </div>
        <p className="text-gray-900 whitespace-pre-wrap">
          {current.question_text}
        </p>

        <div className="mt-5">
          <QuestionRenderer
            questionTypeCode={currentType}
            options={current.question_options}
            value={userAnswer}
            onChange={setAnswerForCurrent}
            disabled={false}
          />
        </div>

        <div className="mt-5 flex items-center justify-between gap-2">
          <div className="flex gap-2">
            <button
              onClick={prev}
              disabled={currentIdx === 0}
              className="text-sm px-4 py-2 rounded-md border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={next}
              disabled={currentIdx === total - 1}
              className="text-sm px-4 py-2 rounded-md border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <span className="text-xs text-gray-400">
            No feedback shown until you submit
          </span>
        </div>
      </div>

      {/* Question navigator — answered vs unanswered only */}
      <div className="mt-6 flex flex-wrap gap-1.5">
        {questions.map((q, idx) => {
          const ans = answersByQ[q.id]
          const an = isAnswered(
            questionTypesById[q.question_type_id]?.code,
            ans,
            q.question_options
          )
          let cls =
            'w-7 h-7 text-xs rounded border flex items-center justify-center '
          cls += an
            ? 'bg-blue-50 border-blue-300 text-blue-700'
            : 'bg-white border-gray-200 text-gray-500'
          if (idx === currentIdx) cls += ' ring-2 ring-blue-500'
          return (
            <button key={q.id} className={cls} onClick={() => setCurrentIdx(idx)}>
              {idx + 1}
            </button>
          )
        })}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={attemptSubmit}
          disabled={submitting}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-md disabled:opacity-50"
        >
          {submitting ? 'Submitting…' : 'Submit exam'}
        </button>
      </div>

      <Modal
        open={submitWarn}
        title="Some questions are unanswered"
        actions={
          <>
            <button
              onClick={() => setSubmitWarn(false)}
              className="text-sm px-4 py-2 rounded-md border border-gray-200 hover:bg-gray-50"
            >
              Return to exam
            </button>
            <button
              onClick={submitExam}
              className="text-sm px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white"
            >
              Submit anyway
            </button>
          </>
        }
      >
        You answered {answeredCount} of {total}. Skipped questions count as
        incorrect.
      </Modal>

      <FlagModal
        open={flagOpen}
        questionId={current?.id}
        onClose={() => setFlagOpen(false)}
      />
    </PageWrapper>
  )
}

// ── Results screen ──────────────────────────────────────────────
function DomainExamResults({
  examId,
  domain,
  los,
  questions,
  questionTypesById,
  answersByQ,
  resultsByQ,
}) {
  const correct = questions.filter((q) => resultsByQ[q.id]?.is_correct).length
  const total = questions.length
  const pct = total ? Math.round((correct / total) * 100) : 0

  // Per-LO breakdown
  const losById = Object.fromEntries(los.map((l) => [l.id, l]))
  const perLo = {}
  for (const q of questions) {
    if (!perLo[q.lo_id]) perLo[q.lo_id] = { total: 0, correct: 0 }
    perLo[q.lo_id].total++
    if (resultsByQ[q.id]?.is_correct) perLo[q.lo_id].correct++
  }

  return (
    <PageWrapper>
      <Link to={`/study/${examId}`} className="text-sm text-blue-600 hover:underline">
        ← Study dashboard
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mt-3">Domain exam complete</h1>
      <p className="text-gray-500">
        {domain?.code} · {domain?.title}
      </p>

      <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
        <p className="text-5xl font-bold text-gray-900">{pct}%</p>
        <p className="text-gray-600 mt-1">
          {correct} of {total} correct
        </p>
      </div>

      <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">
        Per-LO breakdown
      </h2>
      <ul className="space-y-2">
        {Object.entries(perLo).map(([loId, stats]) => {
          const lo = losById[loId]
          const ratio = stats.total ? Math.round((stats.correct / stats.total) * 100) : 0
          return (
            <li
              key={loId}
              className="flex items-center justify-between bg-white border border-gray-200 rounded-md px-4 py-2"
            >
              <div>
                <span className="text-xs font-mono text-gray-500">{lo?.code}</span>{' '}
                <span className="text-sm text-gray-900">{lo?.title}</span>
              </div>
              <span className="text-sm">
                {stats.correct}/{stats.total} ·{' '}
                <span
                  className={`font-semibold ${
                    ratio >= 80
                      ? 'text-green-700'
                      : ratio >= 60
                      ? 'text-yellow-700'
                      : 'text-red-700'
                  }`}
                >
                  {ratio}%
                </span>
              </span>
            </li>
          )
        })}
      </ul>

      <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">
        All questions
      </h2>
      <ul className="space-y-3">
        {questions.map((q, idx) => {
          const r = resultsByQ[q.id]
          const ans = answersByQ[q.id]
          const lo = losById[q.lo_id]
          return (
            <li
              key={q.id}
              className={`bg-white border rounded-md p-4 ${
                r?.is_correct
                  ? 'border-green-200'
                  : r?.answered
                  ? 'border-red-200'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-gray-900">
                  <span className="text-xs font-mono text-gray-500 mr-2">
                    Q{idx + 1} · {lo?.code}
                  </span>
                  {q.question_text}
                </p>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded ${
                    r?.is_correct
                      ? 'bg-green-100 text-green-700'
                      : r?.answered
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {r?.is_correct
                    ? 'Correct'
                    : r?.answered
                    ? 'Incorrect'
                    : 'Skipped'}
                </span>
              </div>

              <div className="mt-3 space-y-1">
                {[...q.question_options]
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((o) => {
                    const correctMark = correctnessIndicator(
                      questionTypesById[q.question_type_id]?.code,
                      o,
                      ans
                    )
                    return (
                      <div
                        key={o.id}
                        className={`text-sm flex gap-2 ${correctMark.cls}`}
                      >
                        <span className="font-mono text-xs w-6">{o.option_key}</span>
                        <span className="flex-1">{o.option_text}</span>
                        <span className="text-xs">{correctMark.label}</span>
                      </div>
                    )
                  })}
              </div>

              <div className="mt-3 text-sm text-gray-600 whitespace-pre-wrap">
                <span className="font-semibold text-gray-700">Explanation: </span>
                {q.explanation}
              </div>
            </li>
          )
        })}
      </ul>

      <div className="mt-8">
        <Link
          to={`/study/${examId}`}
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-md"
        >
          Back to study dashboard
        </Link>
      </div>
    </PageWrapper>
  )
}

// Tiny helper: which inline annotation to show next to each option in the
// post-exam review. Compares user's answer against the correct value.
function correctnessIndicator(code, option, userAnswer) {
  switch (code) {
    case 'mc': {
      const isCorrect = option.answer_value === 'true'
      const isPicked = userAnswer === option.option_key
      if (isCorrect && isPicked) return { label: '✓ correct', cls: 'text-green-700' }
      if (isCorrect) return { label: 'correct answer', cls: 'text-green-700' }
      if (isPicked) return { label: '✗ your pick', cls: 'text-red-700' }
      return { label: '', cls: 'text-gray-700' }
    }
    case 'mr': {
      const arr = Array.isArray(userAnswer) ? userAnswer : []
      const isCorrect = option.answer_value === 'true'
      const isPicked = arr.includes(option.option_key)
      if (isCorrect && isPicked) return { label: '✓ correct', cls: 'text-green-700' }
      if (isCorrect) return { label: 'correct (missed)', cls: 'text-green-700' }
      if (isPicked) return { label: '✗ wrong pick', cls: 'text-red-700' }
      return { label: '', cls: 'text-gray-700' }
    }
    case 'ordering': {
      const arr = Array.isArray(userAnswer) ? userAnswer : []
      const userPos = arr.indexOf(option.option_key) + 1
      const correctPos = parseInt(option.answer_value, 10)
      if (!userPos) return { label: `correct: pos ${correctPos}`, cls: 'text-gray-700' }
      if (userPos === correctPos)
        return { label: `pos ${userPos} ✓`, cls: 'text-green-700' }
      return {
        label: `you: ${userPos} · correct: ${correctPos}`,
        cls: 'text-red-700',
      }
    }
    case 'matching': {
      if (!option.option_key.startsWith('L')) return { label: '', cls: 'text-gray-700' }
      const userPick = userAnswer?.[option.option_key]
      const correct = option.answer_value
      if (!userPick) return { label: `correct: ${correct}`, cls: 'text-gray-700' }
      if (userPick === correct)
        return { label: `→ ${userPick} ✓`, cls: 'text-green-700' }
      return {
        label: `you: ${userPick} · correct: ${correct}`,
        cls: 'text-red-700',
      }
    }
    default:
      return { label: '', cls: 'text-gray-700' }
  }
}
