import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
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
  LOCKED: 'locked',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  ERROR: 'error',
}

export default function DomainExam() {
  const { examId, domainId } = useParams()
  const [searchParams] = useSearchParams()
  const mode = searchParams.get('mode')
  const { user } = useAuth()
  const { toast } = useToast()

  const [stage, setStage] = useState(STAGE.LOADING)
  const [error, setError] = useState(null)
  const [domain, setDomain] = useState(null)
  const [los, setLos] = useState([])

  // session
  const [sessionId, setSessionId] = useState(null)
  const [domainExamSessionId, setDomainExamSessionId] = useState(null)
  const [startedAt, setStartedAt] = useState(null)

  // questions
  const [questions, setQuestions] = useState([])
  const [questionTypesById, setQuestionTypesById] = useState({})

  // per-question state. During the ACTIVE exam only `answersByQ` is
  // populated — `feedbackByQ` is filled at completeExam (or via
  // loadCompletedSession on results/review re-entry) so correctness is
  // never revealed mid-exam.
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answersByQ, setAnswersByQ] = useState({})
  const [feedbackByQ, setFeedbackByQ] = useState({})

  const [submitWarn, setSubmitWarn] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [flagOpen, setFlagOpen] = useState(false)

  // StrictMode-safe single-flight (same rationale as LOQuiz).
  const startedRef = useRef(false)

  useEffect(() => {
    if (!user) return
    if (startedRef.current) return
    startedRef.current = true
    async function load() {
      try {
        const { data: dom, error: domErr } = await supabase
          .from('domains')
          .select('id, code, title')
          .eq('id', domainId)
          .single()
        if (domErr) throw domErr
        setDomain(dom)

        const { data: domLos, error: lErr } = await supabase
          .from('los')
          .select('id, code, title, sort_order')
          .eq('domain_id', domainId)
          .order('sort_order')
        if (lErr) throw lErr
        setLos(domLos ?? [])

        if (mode === 'results' || mode === 'review') {
          await loadCompletedSession()
          return
        }

        // Unlock check: every LO in domain must have a completed lo_quiz_session
        if (!domLos?.length) {
          setError('Domain has no learning objectives.')
          setStage(STAGE.ERROR)
          return
        }
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

        // No resume for domain exams — abandon any prior active session
        // and start fresh. Leaving mid-exam is a hard reset by design.
        const { data: active } = await supabase
          .from('domain_exam_sessions')
          .select('id, session_id, sessions!inner(user_id, exam_id)')
          .eq('domain_id', domainId)
          .eq('status', 'active')
          .eq('sessions.user_id', user.id)
          .eq('sessions.exam_id', examId)
          .order('started_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (active) {
          await supabase
            .from('domain_exam_sessions')
            .update({ status: 'abandoned' })
            .eq('id', active.id)
        }
        await createFreshSession()
      } catch (e) {
        setError(e.message)
        setStage(STAGE.ERROR)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, examId, domainId])

  async function createFreshSession() {
    try {
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

      setSessionId(sRow.id)
      setDomainExamSessionId(des.id)
      setStartedAt(Date.now())
      await loadQuestionsAndStart(sRow.id)
    } catch (e) {
      setError(e.message)
      setStage(STAGE.ERROR)
    }
  }

  async function loadQuestionsAndStart() {
    const { data: qs, error: qErr } = await supabase
      .from('questions')
      .select(
        'id, lo_id, domain_id, question_type_id, question_text, explanation, difficulty, question_options(*), question_subtopics(lo_id)'
      )
      .eq('domain_id', domainId)
      .order('created_at')
    if (qErr) {
      setError(qErr.message)
      setStage(STAGE.ERROR)
      return
    }

    const { data: qts } = await supabase.from('question_types').select('*')
    const qtMap = {}
    for (const t of qts ?? []) qtMap[t.id] = t
    setQuestionTypesById(qtMap)

    if (!qs || qs.length === 0) {
      setQuestions([])
      setStage(STAGE.ACTIVE)
      return
    }

    // No resume — start fresh every time. answersByQ/feedbackByQ stay empty.
    setAnswersByQ({})
    setFeedbackByQ({})
    setQuestions(shuffle(qs))
    setCurrentIdx(0)
    setStage(STAGE.ACTIVE)
  }

  async function loadCompletedSession() {
    const { data: completed, error: cErr } = await supabase
      .from('domain_exam_sessions')
      .select('id, session_id, sessions!inner(user_id, exam_id)')
      .eq('domain_id', domainId)
      .eq('status', 'completed')
      .eq('sessions.user_id', user.id)
      .eq('sessions.exam_id', examId)
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (cErr) {
      setError(cErr.message)
      setStage(STAGE.ERROR)
      return
    }
    if (!completed) {
      // Nothing to view — fall back to fresh start path (which will gate
      // on unlock if needed). Easiest: re-run the regular flow.
      setStage(STAGE.LOCKED)
      return
    }

    setSessionId(completed.session_id)
    setDomainExamSessionId(completed.id)

    const { data: qs, error: qErr } = await supabase
      .from('questions')
      .select(
        'id, lo_id, domain_id, question_type_id, question_text, explanation, difficulty, question_options(*), question_subtopics(lo_id)'
      )
      .eq('domain_id', domainId)
      .order('created_at')
    if (qErr) {
      setError(qErr.message)
      setStage(STAGE.ERROR)
      return
    }
    const { data: qts } = await supabase.from('question_types').select('*')
    const qtMap = {}
    for (const t of qts ?? []) qtMap[t.id] = t
    setQuestionTypesById(qtMap)

    const { data: existingAttempts } = await supabase
      .from('attempts')
      .select('question_id, is_correct, user_answer')
      .eq('session_id', completed.session_id)
    const ans = {}
    const fb = {}
    for (const a of existingAttempts ?? []) {
      ans[a.question_id] = a.user_answer
      fb[a.question_id] = { is_correct: a.is_correct }
    }
    setAnswersByQ(ans)
    setFeedbackByQ(fb)

    setQuestions(qs ?? [])
    setStage(STAGE.COMPLETED)
  }

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
  function jumpTo(idx) {
    setCurrentIdx(idx)
  }

  function attemptSubmitExam() {
    if (answeredCount < total) setSubmitWarn(true)
    else completeExam()
  }

  async function completeExam() {
    setSubmitWarn(false)
    setCompleting(true)
    try {
      // Score every answered question locally, then batch-insert attempts.
      // Skipped questions get no attempt row and count as incorrect for
      // correct_count reporting.
      const attemptRows = []
      const fbNext = {}
      for (const q of questions) {
        const code = questionTypesById[q.question_type_id]?.code
        const userAnswer = answersByQ[q.id]
        if (!isAnswered(code, userAnswer, q.question_options)) continue
        const is_correct = calculateIsCorrect(
          code,
          userAnswer,
          q.question_options
        )
        attemptRows.push({
          session_id: sessionId,
          user_id: user.id,
          question_id: q.id,
          question_type_id: q.question_type_id,
          is_correct,
          user_answer: userAnswer,
        })
        fbNext[q.id] = { is_correct }
      }

      if (attemptRows.length) {
        const { error: insErr } = await supabase
          .from('attempts')
          .insert(attemptRows)
        if (insErr) throw insErr
      }

      const correctCount = attemptRows.filter((a) => a.is_correct).length
      const elapsed = startedAt
        ? Math.round((Date.now() - startedAt) / 1000)
        : null
      const { error: upErr } = await supabase
        .from('domain_exam_sessions')
        .update({
          status: 'completed',
          correct_count: correctCount,
          total_questions: total,
          time_taken_seconds: elapsed,
          completed_at: new Date().toISOString(),
        })
        .eq('id', domainExamSessionId)
      if (upErr) throw upErr

      // Reveal correctness only now — drives DomainExamResults breakdown
      // and (via mode=review) the per-question playback screen.
      setFeedbackByQ(fbNext)

      toast(`Domain exam complete — ${correctCount} of ${total} correct.`)
      setStage(STAGE.COMPLETED)
    } catch (e) {
      setError(e.message)
      toast({ tone: 'error', message: `Couldn't submit: ${e.message}` })
      setCompleting(false)
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
    if (mode === 'review') {
      return (
        <DomainExamReview
          examId={examId}
          domain={domain}
          questions={questions}
          questionTypesById={questionTypesById}
          feedbackByQ={feedbackByQ}
          answersByQ={answersByQ}
        />
      )
    }
    return (
      <DomainExamResults
        examId={examId}
        domain={domain}
        los={los}
        questions={questions}
        feedbackByQ={feedbackByQ}
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
          Question {currentIdx + 1} of {total} · {answeredCount} answered
        </div>
      </div>

      <div
        className="mt-3 p-3 rounded-md border border-yellow-300 bg-yellow-50 text-sm text-yellow-800"
        role="alert"
      >
        <strong>Heads up:</strong> if you leave this page before submitting,
        all answers are discarded and the exam restarts from question 1.
      </div>

      <div className="mt-3 h-1.5 w-full bg-gray-200 rounded">
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
        <p className="text-gray-900 whitespace-pre-wrap">{current.question_text}</p>

        <div className="mt-5">
          <QuestionRenderer
            questionTypeCode={currentType}
            options={current.question_options}
            value={userAnswer}
            onChange={setAnswerForCurrent}
            disabled={false}
            feedback={null}
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
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
            Answers stay editable until you submit the exam.
          </span>
        </div>
      </div>

      {/* Question navigator — answered (blue) vs not answered (gray).
          Correctness is never revealed during the active exam. */}
      <div className="mt-6 flex flex-wrap gap-1.5">
        {questions.map((q, idx) => {
          const an = isAnswered(
            questionTypesById[q.question_type_id]?.code,
            answersByQ[q.id],
            q.question_options
          )
          let cls =
            'w-7 h-7 text-xs rounded border flex items-center justify-center '
          if (an) cls += 'bg-blue-50 border-blue-300 text-blue-700'
          else cls += 'bg-white border-gray-200 text-gray-500'
          if (idx === currentIdx) cls += ' ring-2 ring-blue-500'
          return (
            <button key={q.id} className={cls} onClick={() => jumpTo(idx)}>
              {idx + 1}
            </button>
          )
        })}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={attemptSubmitExam}
          disabled={completing}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-md disabled:opacity-50"
        >
          {completing ? 'Submitting…' : 'Submit exam'}
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
              onClick={completeExam}
              className="text-sm px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white"
            >
              Submit anyway
            </button>
          </>
        }
      >
        You answered {answeredCount} of {total} questions. Skipped questions count
        as incorrect.
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
function DomainExamResults({ examId, domain, los, questions, feedbackByQ }) {
  const correct = questions.filter((q) => feedbackByQ[q.id]?.is_correct).length
  const total = questions.length
  const pct = total ? Math.round((correct / total) * 100) : 0

  // Per-LO breakdown via question_subtopics. A question can tag multiple
  // LOs; attribute it to each distinct LO it touches (matches the
  // subtopic_accuracy view's many-rows-per-attempt convention).
  const losById = Object.fromEntries(los.map((l) => [l.id, l]))
  const perLo = {}
  for (const q of questions) {
    const fb = feedbackByQ[q.id]
    const loIds = new Set(
      (q.question_subtopics ?? []).map((qs) => qs.lo_id).filter(Boolean)
    )
    for (const loId of loIds) {
      if (!perLo[loId]) perLo[loId] = { total: 0, correct: 0 }
      perLo[loId].total++
      if (fb?.is_correct) perLo[loId].correct++
    }
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
        {los.map((lo) => {
          const stats = perLo[lo.id] ?? { total: 0, correct: 0 }
          const ratio = stats.total
            ? Math.round((stats.correct / stats.total) * 100)
            : null
          return (
            <li
              key={lo.id}
              className="flex items-center justify-between bg-white border border-gray-200 rounded-md px-4 py-2 gap-3"
            >
              <div className="min-w-0">
                <span className="text-xs font-mono text-gray-500 mr-2">{lo.code}</span>
                <span className="text-sm text-gray-900">{lo.title}</span>
              </div>
              <span className="text-sm whitespace-nowrap">
                {stats.correct}/{stats.total}
                {ratio != null && (
                  <>
                    {' · '}
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
                  </>
                )}
              </span>
            </li>
          )
        })}
        {los.length === 0 && (
          <li className="text-sm text-gray-500">No LOs in this domain.</li>
        )}
      </ul>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          to={`/study/${examId}`}
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-md"
        >
          Back to study dashboard
        </Link>
        <Link
          to={`/study/${examId}/domain/${domain?.id}/exam?mode=review`}
          className="inline-block bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium px-5 py-2 rounded-md"
        >
          Review exam
        </Link>
      </div>
    </PageWrapper>
  )
}

// ── Review screen ───────────────────────────────────────────────
function DomainExamReview({
  examId,
  domain,
  questions,
  questionTypesById,
  feedbackByQ,
  answersByQ,
}) {
  const [flagQid, setFlagQid] = useState(null)
  const correct = questions.filter((q) => feedbackByQ[q.id]?.is_correct).length
  const total = questions.length

  return (
    <PageWrapper>
      <Link to={`/study/${examId}`} className="text-sm text-blue-600 hover:underline">
        ← Study dashboard
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mt-3">Domain exam review</h1>
      <p className="text-gray-500">
        {domain?.code} · {domain?.title}
      </p>
      <p className="text-sm text-gray-600 mt-2">
        {correct} of {total} correct
      </p>

      <div className="mt-6 space-y-5">
        {questions.map((q, idx) => {
          const code = questionTypesById[q.question_type_id]?.code
          const label = questionTypesById[q.question_type_id]?.label
          const fb = feedbackByQ[q.id]
          const ans = answersByQ[q.id]
          const wasAnswered = ans !== undefined && fb !== undefined

          return (
            <div
              key={q.id}
              className="bg-white border border-gray-200 rounded-lg p-5"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="text-xs uppercase tracking-wide text-gray-500">
                  Q{idx + 1} of {total} · {label}
                </div>
                <div className="flex items-center gap-3">
                  {!wasAnswered ? (
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                      Not answered
                    </span>
                  ) : fb?.is_correct ? (
                    <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-800">
                      Correct
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-800">
                      Incorrect
                    </span>
                  )}
                  <button
                    onClick={() => setFlagQid(q.id)}
                    title="Report this question"
                    className="text-xs text-gray-400 hover:text-red-600 flex items-center gap-1"
                  >
                    <span aria-hidden>⚑</span> Report
                  </button>
                </div>
              </div>

              <p className="text-gray-900 whitespace-pre-wrap">{q.question_text}</p>

              <div className="mt-5">
                <QuestionRenderer
                  questionTypeCode={code}
                  options={q.question_options}
                  value={ans ?? emptyAnswerFor(code)}
                  onChange={() => {}}
                  disabled
                  feedback={fb ?? null}
                />
              </div>

              <div
                className={`mt-5 p-4 rounded-md border ${
                  !wasAnswered
                    ? 'bg-gray-50 border-gray-200'
                    : fb?.is_correct
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {q.explanation}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-8">
        <Link
          to={`/study/${examId}`}
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-md"
        >
          Back to study dashboard
        </Link>
      </div>

      <FlagModal
        open={Boolean(flagQid)}
        questionId={flagQid}
        onClose={() => setFlagQid(null)}
      />
    </PageWrapper>
  )
}
