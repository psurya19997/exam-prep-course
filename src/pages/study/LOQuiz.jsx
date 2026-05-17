import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
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
  RESUME_DIALOG: 'resume_dialog',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  ERROR: 'error',
}

export default function LOQuiz() {
  const { examId, loId } = useParams()
  const [searchParams] = useSearchParams()
  const mode = searchParams.get('mode')
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [stage, setStage] = useState(STAGE.LOADING)
  const [error, setError] = useState(null)
  const [lo, setLo] = useState(null)

  // session
  const [sessionId, setSessionId] = useState(null) // sessions.id
  const [loQuizSessionId, setLoQuizSessionId] = useState(null) // lo_quiz_sessions.id
  const [existingActive, setExistingActive] = useState(null) // {session_id, lo_quiz_session_id}
  const [startedAt, setStartedAt] = useState(null)

  // questions
  const [questions, setQuestions] = useState([])
  const [questionTypesById, setQuestionTypesById] = useState({})

  // per-question state
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answersByQ, setAnswersByQ] = useState({}) // qid → user answer
  const [feedbackByQ, setFeedbackByQ] = useState({}) // qid → { is_correct }
  const [submittedByQ, setSubmittedByQ] = useState({}) // qid → boolean (locked, attempt inserted)

  // submit warning
  const [submitWarn, setSubmitWarn] = useState(false)
  const [completing, setCompleting] = useState(false)

  // flag
  const [flagOpen, setFlagOpen] = useState(false)

  // StrictMode-safe single-flight: prevents duplicate session inserts
  // when the effect is re-run on remount. NOTE: we deliberately don't pair
  // this with a "cancelled" flag — under StrictMode the cleanup of the
  // first pass would flip cancelled=true while the ref makes the second
  // pass bail, leaving the load forever stuck mid-flight.
  const startedRef = useRef(false)

  // ── Initial load ──────────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    if (startedRef.current) return
    startedRef.current = true
    async function load() {
      const { data: loData, error: loErr } = await supabase
        .from('los')
        .select('id, code, title, domain_id')
        .eq('id', loId)
        .single()
      if (loErr) {
        setError(loErr.message)
        setStage(STAGE.ERROR)
        return
      }
      setLo(loData)

      if (mode === 'results' || mode === 'review') {
        await loadCompletedSession()
        return
      }

      const { data: active } = await supabase
        .from('lo_quiz_sessions')
        .select('id, session_id, sessions!inner(user_id, exam_id)')
        .eq('lo_id', loId)
        .eq('status', 'active')
        .eq('sessions.user_id', user.id)
        .eq('sessions.exam_id', examId)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (active) {
        setExistingActive({
          session_id: active.session_id,
          lo_quiz_session_id: active.id,
        })
        setStage(STAGE.RESUME_DIALOG)
      } else {
        await createFreshSession()
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, examId, loId])

  async function loadCompletedSession() {
    const { data: completed, error: cErr } = await supabase
      .from('lo_quiz_sessions')
      .select('id, session_id, sessions!inner(user_id, exam_id)')
      .eq('lo_id', loId)
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
      await createFreshSession()
      return
    }

    setSessionId(completed.session_id)
    setLoQuizSessionId(completed.id)

    const { data: qs, error: qErr } = await supabase
      .from('questions')
      .select(
        'id, lo_id, question_type_id, question_text, explanation, difficulty, question_options(*)'
      )
      .eq('lo_id', loId)
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
    const sub = {}
    for (const a of existingAttempts ?? []) {
      ans[a.question_id] = a.user_answer
      fb[a.question_id] = { is_correct: a.is_correct }
      sub[a.question_id] = true
    }
    setAnswersByQ(ans)
    setFeedbackByQ(fb)
    setSubmittedByQ(sub)

    setQuestions(qs ?? [])
    setStage(STAGE.COMPLETED)
  }

  async function createFreshSession() {
    try {
      const { data: sessionRow, error: sErr } = await supabase
        .from('sessions')
        .insert({
          user_id: user.id,
          exam_id: examId,
          session_type: 'lo_quiz',
        })
        .select()
        .single()
      if (sErr) throw sErr

      const { data: lqs, error: lqErr } = await supabase
        .from('lo_quiz_sessions')
        .insert({
          session_id: sessionRow.id,
          lo_id: loId,
          status: 'active',
        })
        .select()
        .single()
      if (lqErr) throw lqErr

      setSessionId(sessionRow.id)
      setLoQuizSessionId(lqs.id)
      setStartedAt(Date.now())
      await loadQuestionsAndStart(sessionRow.id)
    } catch (e) {
      setError(e.message)
      setStage(STAGE.ERROR)
    }
  }

  async function resumeSession() {
    if (!existingActive) return
    setSessionId(existingActive.session_id)
    setLoQuizSessionId(existingActive.lo_quiz_session_id)
    setStartedAt(Date.now())
    await loadQuestionsAndStart(existingActive.session_id, false)
  }

  async function abandonAndRestart() {
    if (!existingActive) return
    const { error: upErr } = await supabase
      .from('lo_quiz_sessions')
      .update({ status: 'abandoned' })
      .eq('id', existingActive.lo_quiz_session_id)
    if (upErr) {
      setError(upErr.message)
      setStage(STAGE.ERROR)
      return
    }
    setExistingActive(null)
    await createFreshSession()
  }

  async function loadQuestionsAndStart(sId, shouldShuffle = true) {
    // Load all questions for this LO
    const { data: qs, error: qErr } = await supabase
      .from('questions')
      .select(
        'id, lo_id, question_type_id, question_text, explanation, difficulty, question_options(*)'
      )
      .eq('lo_id', loId)
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

    // If resuming, prefill submitted/feedback from existing attempts
    const { data: existingAttempts } = await supabase
      .from('attempts')
      .select('question_id, is_correct, user_answer')
      .eq('session_id', sId)

    const ans = {}
    const fb = {}
    const sub = {}
    for (const a of existingAttempts ?? []) {
      ans[a.question_id] = a.user_answer
      fb[a.question_id] = { is_correct: a.is_correct }
      sub[a.question_id] = true
    }
    setAnswersByQ(ans)
    setFeedbackByQ(fb)
    setSubmittedByQ(sub)

    setQuestions(shouldShuffle ? shuffle(qs) : qs)
    setCurrentIdx(0)
    setStage(STAGE.ACTIVE)
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

  // ── per-question handlers ─────────────────────────────────────
  function setAnswerForCurrent(val) {
    if (!current) return
    setAnswersByQ((prev) => ({ ...prev, [current.id]: val }))
  }

  async function submitCurrentAnswer() {
    if (!current || submittedByQ[current.id]) return
    const code = currentType
    const userAnswer = answersByQ[current.id]
    if (!isAnswered(code, userAnswer, current.question_options)) return

    const is_correct = calculateIsCorrect(
      code,
      userAnswer,
      current.question_options
    )

    const { error: insErr } = await supabase.from('attempts').insert({
      session_id: sessionId,
      user_id: user.id,
      question_id: current.id,
      question_type_id: current.question_type_id,
      is_correct,
      user_answer: userAnswer,
    })
    if (insErr) {
      setError(insErr.message)
      return
    }

    setFeedbackByQ((prev) => ({ ...prev, [current.id]: { is_correct } }))
    setSubmittedByQ((prev) => ({ ...prev, [current.id]: true }))
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

  // ── completion ────────────────────────────────────────────────
  function attemptSubmitQuiz() {
    if (answeredCount < total) setSubmitWarn(true)
    else completeQuiz()
  }

  async function completeQuiz() {
    setSubmitWarn(false)
    setCompleting(true)
    try {
      const correctCount = questions.reduce((acc, q) => {
        const fb = feedbackByQ[q.id]
        return acc + (fb?.is_correct ? 1 : 0)
      }, 0)
      const elapsed = startedAt
        ? Math.round((Date.now() - startedAt) / 1000)
        : null

      const { error: upErr } = await supabase
        .from('lo_quiz_sessions')
        .update({
          status: 'completed',
          correct_count: correctCount,
          total_questions: total,
          time_taken_seconds: elapsed,
          completed_at: new Date().toISOString(),
        })
        .eq('id', loQuizSessionId)
      if (upErr) throw upErr

      toast(`Quiz complete — ${correctCount} of ${total} correct.`)
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
        <LoadingState label="Preparing quiz…" />
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
  if (stage === STAGE.RESUME_DIALOG) {
    return (
      <PageWrapper>
        <Modal
          open
          title="Resume or restart?"
          actions={
            <>
              <button
                onClick={abandonAndRestart}
                className="text-sm px-4 py-2 rounded-md border border-gray-200 hover:bg-gray-50"
              >
                Restart
              </button>
              <button
                onClick={resumeSession}
                className="text-sm px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white"
              >
                Resume
              </button>
            </>
          }
        >
          You have an in-progress quiz for this LO. Resume keeps your saved
          answers; Restart abandons them and starts a fresh quiz from question 1.
        </Modal>
      </PageWrapper>
    )
  }
  if (stage === STAGE.COMPLETED) {
    if (mode === 'review') {
      return <QuizReview
        examId={examId}
        lo={lo}
        questions={questions}
        questionTypesById={questionTypesById}
        feedbackByQ={feedbackByQ}
        answersByQ={answersByQ}
      />
    }
    return <QuizResults
      examId={examId}
      lo={lo}
      sessionId={sessionId}
      questions={questions}
      questionTypesById={questionTypesById}
      feedbackByQ={feedbackByQ}
      answersByQ={answersByQ}
    />
  }

  // ACTIVE — main quiz UI
  if (questions.length === 0) {
    return (
      <PageWrapper>
        <Link to={`/study/${examId}`} className="text-sm text-blue-600 hover:underline">
          ← Study dashboard
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-4">{lo?.title}</h1>
        <div className="mt-6">
          <EmptyState
            title="No questions yet"
            description="This LO doesn't have any practice questions seeded yet. Check back soon."
          />
        </div>
      </PageWrapper>
    )
  }

  const submitted = Boolean(submittedByQ[current.id])
  const feedback = feedbackByQ[current.id]
  const userAnswer = answersByQ[current.id] ?? emptyAnswerFor(currentType)

  return (
    <PageWrapper>
      <Link to={`/study/${examId}`} className="text-sm text-blue-600 hover:underline">
        ← Study dashboard
      </Link>

      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <span className="text-xs font-mono text-gray-500">{lo?.code}</span>
          <h1 className="text-xl font-bold text-gray-900">{lo?.title}</h1>
        </div>
        <div className="text-sm text-gray-500">
          Question {currentIdx + 1} of {total} · {answeredCount} answered
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
        <p className="text-gray-900 whitespace-pre-wrap">{current.question_text}</p>

        <div className="mt-5">
          <QuestionRenderer
            questionTypeCode={currentType}
            options={current.question_options}
            value={userAnswer}
            onChange={setAnswerForCurrent}
            disabled={submitted}
            feedback={submitted ? feedback ?? null : null}
          />
        </div>

        {submitted && feedback && (
          <div
            className={`mt-5 p-4 rounded-md border ${
              feedback.is_correct
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            <p
              className={`font-semibold ${
                feedback.is_correct ? 'text-green-700' : 'text-red-700'
              }`}
            >
              {feedback.is_correct ? 'Correct' : 'Incorrect'}
            </p>
            <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
              {current.explanation}
            </p>
          </div>
        )}

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
              {submitted ? 'Next' : 'Skip'}
            </button>
          </div>
          {!submitted ? (
            <button
              onClick={submitCurrentAnswer}
              disabled={
                !isAnswered(currentType, userAnswer, current.question_options)
              }
              className="text-sm px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            >
              Check answer
            </button>
          ) : (
            <span className="text-xs text-gray-400">
              Locked — answer recorded
            </span>
          )}
        </div>
      </div>

      {/* Question navigator */}
      <div className="mt-6 flex flex-wrap gap-1.5">
        {questions.map((q, idx) => {
          const fb = feedbackByQ[q.id]
          const ans = answersByQ[q.id]
          const an = isAnswered(
            questionTypesById[q.question_type_id]?.code,
            ans,
            q.question_options
          )
          let cls =
            'w-7 h-7 text-xs rounded border flex items-center justify-center '
          if (fb?.is_correct) cls += 'bg-green-100 border-green-300 text-green-800'
          else if (fb && !fb.is_correct)
            cls += 'bg-red-100 border-red-300 text-red-800'
          else if (an) cls += 'bg-blue-50 border-blue-300 text-blue-700'
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
          onClick={attemptSubmitQuiz}
          disabled={completing}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-md disabled:opacity-50"
        >
          {completing ? 'Submitting…' : 'Submit quiz'}
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
              Return to quiz
            </button>
            <button
              onClick={completeQuiz}
              className="text-sm px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white"
            >
              Submit anyway
            </button>
          </>
        }
      >
        You answered {answeredCount} of {total} questions. Skipped questions
        count as incorrect.
      </Modal>

      <button
        onClick={() => navigate(`/study/${examId}`)}
        className="mt-8 text-xs text-gray-400 hover:text-gray-600"
      >
        Save and exit (resume later)
      </button>

      <FlagModal
        open={flagOpen}
        questionId={current?.id}
        onClose={() => setFlagOpen(false)}
      />
    </PageWrapper>
  )
}

// ── Results screen ────────────────────────────────────────────
function QuizResults({
  examId,
  lo,
  sessionId,
  questions,
  questionTypesById,
  feedbackByQ,
}) {
  const [subAccuracy, setSubAccuracy] = useState([])
  const [subtopicById, setSubtopicById] = useState({})

  useEffect(() => {
    if (!sessionId) return
    let cancelled = false
    async function load() {
      const [{ data: accRows }, { data: subRows }] = await Promise.all([
        supabase
          .from('subtopic_accuracy')
          .select('subtopic_id, attempts, correct, accuracy_pct')
          .eq('lo_id', lo.id),
        supabase
          .from('subtopics')
          .select('id, code, title')
          .eq('lo_id', lo.id),
      ])
      if (cancelled) return
      const map = {}
      for (const s of subRows ?? []) map[s.id] = s
      setSubtopicById(map)
      setSubAccuracy(accRows ?? [])
    }
    load()
    return () => {
      cancelled = true
    }
  }, [sessionId, lo])

  const correct = questions.filter((q) => feedbackByQ[q.id]?.is_correct).length
  const total = questions.length
  const pct = total ? Math.round((correct / total) * 100) : 0

  return (
    <PageWrapper>
      <Link to={`/study/${examId}`} className="text-sm text-blue-600 hover:underline">
        ← Study dashboard
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mt-3">Quiz complete</h1>
      <p className="text-gray-500">{lo?.code} · {lo?.title}</p>

      <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
        <p className="text-5xl font-bold text-gray-900">{pct}%</p>
        <p className="text-gray-600 mt-1">
          {correct} of {total} correct
        </p>
      </div>

      {subAccuracy.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Per-subtopic accuracy
          </h2>
          <ul className="space-y-2">
            {subAccuracy.map((row) => {
              const sub = subtopicById[row.subtopic_id]
              return (
                <li
                  key={row.subtopic_id}
                  className="flex items-center justify-between bg-white border border-gray-200 rounded-md px-4 py-2 gap-3"
                >
                  <div className="min-w-0">
                    {sub?.code && (
                      <span className="text-xs font-mono text-gray-500 mr-2">
                        {sub.code}
                      </span>
                    )}
                    <span className="text-sm text-gray-900">
                      {sub?.title ?? sub?.code ?? row.subtopic_id}
                    </span>
                  </div>
                  <span className="text-sm whitespace-nowrap">
                    {row.correct}/{row.attempts} ·{' '}
                    <span
                      className={`font-semibold ${
                        row.accuracy_pct >= 80
                          ? 'text-green-700'
                          : row.accuracy_pct >= 60
                          ? 'text-yellow-700'
                          : 'text-red-700'
                      }`}
                    >
                      {row.accuracy_pct}%
                    </span>
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}

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

// ── Review screen ─────────────────────────────────────────────
function QuizReview({
  examId,
  lo,
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
      <h1 className="text-2xl font-bold text-gray-900 mt-3">Quiz review</h1>
      <p className="text-gray-500">
        {lo?.code} · {lo?.title}
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
