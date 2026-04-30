import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { useAuth } from '../../hooks/useAuth.jsx'
import PageWrapper from '../../components/layout/PageWrapper.jsx'
import { LoadingState } from '../../components/ui/Spinner.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'

function fmtDate(s) {
  if (!s) return ''
  const d = new Date(s)
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function pctColour(p) {
  if (p == null) return 'text-gray-500'
  if (p >= 80) return 'text-green-700'
  if (p >= 60) return 'text-yellow-700'
  return 'text-red-700'
}

export default function ProgressDashboard() {
  const { user } = useAuth()
  const [enrollments, setEnrollments] = useState([])
  const [examId, setExamId] = useState(null)
  const [exam, setExam] = useState(null)
  const [domains, setDomains] = useState([])
  const [los, setLos] = useState([])
  const [subtopics, setSubtopics] = useState([])

  const [subRows, setSubRows] = useState([])
  const [qtRows, setQtRows] = useState([])
  const [loQuizSessions, setLoQuizSessions] = useState([])
  const [domainExamSessions, setDomainExamSessions] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load enrollments
  useEffect(() => {
    if (!user) return
    let cancelled = false
    async function load() {
      const { data, error } = await supabase
        .from('enrollments')
        .select('exam_id, exams(id, code, title)')
        .eq('user_id', user.id)
      if (cancelled) return
      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
      setEnrollments(data ?? [])
      if ((data ?? []).length > 0) setExamId(data[0].exam_id)
      else setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [user])

  // Load all per-exam data when examId changes
  useEffect(() => {
    if (!user || !examId) return
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const examP = supabase
          .from('exams')
          .select(
            'id, code, title, domains(id, code, title, sort_order, los(id, code, title, sort_order, subtopics(id, code, title)))'
          )
          .eq('id', examId)
          .single()

        const subP = supabase
          .from('subtopic_accuracy')
          .select('*')
          .eq('user_id', user.id)
          .eq('exam_id', examId)
        const qtP = supabase
          .from('question_type_accuracy')
          .select('*')
          .eq('user_id', user.id)
          .eq('exam_id', examId)

        const lqsP = supabase
          .from('lo_quiz_sessions')
          .select(
            'id, lo_id, status, correct_count, total_questions, time_taken_seconds, completed_at, sessions!inner(user_id, exam_id)'
          )
          .eq('sessions.user_id', user.id)
          .eq('sessions.exam_id', examId)
          .eq('status', 'completed')
          .order('completed_at', { ascending: false })

        const desP = supabase
          .from('domain_exam_sessions')
          .select(
            'id, domain_id, status, correct_count, total_questions, time_taken_seconds, completed_at, sessions!inner(user_id, exam_id)'
          )
          .eq('sessions.user_id', user.id)
          .eq('sessions.exam_id', examId)
          .eq('status', 'completed')
          .order('completed_at', { ascending: false })

        const [
          { data: examData, error: examErr },
          { data: subData },
          { data: qtData },
          { data: lqsData },
          { data: desData },
        ] = await Promise.all([examP, subP, qtP, lqsP, desP])

        if (cancelled) return
        if (examErr) throw examErr

        examData.domains.sort((a, b) => a.sort_order - b.sort_order)
        examData.domains.forEach((d) =>
          d.los.sort((a, b) => a.sort_order - b.sort_order)
        )
        const flatLos = examData.domains.flatMap((d) => d.los)
        const flatSubs = flatLos.flatMap((l) => l.subtopics ?? [])
        setExam(examData)
        setDomains(examData.domains)
        setLos(flatLos)
        setSubtopics(flatSubs)

        setSubRows(subData ?? [])
        setQtRows(qtData ?? [])
        setLoQuizSessions(lqsData ?? [])
        setDomainExamSessions(desData ?? [])
      } catch (e) {
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [user, examId])

  // Aggregate subtopic_accuracy → domain-level
  const perDomain = (() => {
    const map = {}
    for (const d of domains) map[d.id] = { attempts: 0, correct: 0, domain: d }
    for (const r of subRows) {
      if (!map[r.domain_id]) continue
      map[r.domain_id].attempts += r.attempts
      map[r.domain_id].correct += r.correct
    }
    return Object.values(map).map((m) => ({
      ...m,
      pct: m.attempts ? Math.round((m.correct / m.attempts) * 1000) / 10 : null,
    }))
  })()

  const losById = Object.fromEntries(los.map((l) => [l.id, l]))
  const subtopicsById = Object.fromEntries(subtopics.map((s) => [s.id, s]))
  const domainsById = Object.fromEntries(domains.map((d) => [d.id, d]))

  const overallAttempts = subRows.reduce((a, r) => a + r.attempts, 0)
  const overallCorrect = subRows.reduce((a, r) => a + r.correct, 0)
  const overallPct = overallAttempts
    ? Math.round((overallCorrect / overallAttempts) * 1000) / 10
    : null

  // Weakest subtopics: accuracy_pct < 60
  const weakest = [...subRows]
    .filter((r) => r.accuracy_pct < 60)
    .sort((a, b) => a.accuracy_pct - b.accuracy_pct)
    .slice(0, 5)

  // Highest single-row for question-type bar normalisation
  const maxQtAttempts = Math.max(0, ...qtRows.map((r) => r.attempts))

  return (
    <PageWrapper>
      <h1 className="text-2xl font-bold text-gray-900">Progress</h1>

      {enrollments.length > 1 && (
        <div className="mt-3">
          <label className="text-sm text-gray-600 mr-2">Exam:</label>
          <select
            value={examId ?? ''}
            onChange={(e) => setExamId(e.target.value)}
            className="border border-gray-300 rounded-md px-2 py-1 text-sm"
          >
            {enrollments.map((e) => (
              <option key={e.exam_id} value={e.exam_id}>
                {e.exams?.code} — {e.exams?.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {loading && <LoadingState />}
      {error && <p className="text-red-600 text-sm mt-6">{error}</p>}

      {!loading && !error && enrollments.length === 0 && (
        <div className="mt-6">
          <EmptyState
            title="No enrollments yet"
            description="Enroll in an exam to start tracking your progress."
            action={
              <Link
                to="/exams"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-md text-sm"
              >
                Browse exams
              </Link>
            }
          />
        </div>
      )}

      {!loading && !error && exam && (
        <>
          {/* Headline */}
          <div className="mt-6 grid sm:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Overall accuracy
              </p>
              <p className={`mt-2 text-3xl font-bold ${pctColour(overallPct)}`}>
                {overallPct != null ? `${overallPct}%` : '—'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {overallCorrect} / {overallAttempts} answers
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                LO quizzes
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {loQuizSessions.length}
              </p>
              <p className="text-xs text-gray-500 mt-1">completed</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Domain exams
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {domainExamSessions.length}
              </p>
              <p className="text-xs text-gray-500 mt-1">completed</p>
            </div>
          </div>

          {/* Per-domain accuracy */}
          <h2 className="text-lg font-semibold text-gray-900 mt-10 mb-3">
            Accuracy by domain
          </h2>
          <ul className="space-y-2">
            {perDomain.map((d) => (
              <li
                key={d.domain.id}
                className="flex items-center justify-between bg-white border border-gray-200 rounded-md px-4 py-2"
              >
                <div>
                  <span className="text-xs font-mono text-gray-500">
                    {d.domain.code}
                  </span>{' '}
                  <span className="text-sm text-gray-900">{d.domain.title}</span>
                </div>
                <span className="text-sm">
                  {d.correct}/{d.attempts} ·{' '}
                  <span className={`font-semibold ${pctColour(d.pct)}`}>
                    {d.pct != null ? `${d.pct}%` : '—'}
                  </span>
                </span>
              </li>
            ))}
            {perDomain.length === 0 && (
              <li className="text-sm text-gray-500">No domains.</li>
            )}
          </ul>

          {/* Weakest subtopics */}
          {weakest.length > 0 && (
            <>
              <h2 className="text-lg font-semibold text-gray-900 mt-10 mb-3">
                Weakest subtopics (under 60%)
              </h2>
              <ul className="space-y-2">
                {weakest.map((r) => {
                  const sub = subtopicsById[r.subtopic_id]
                  const lo = losById[r.lo_id]
                  return (
                    <li
                      key={r.subtopic_id}
                      className="flex items-center justify-between bg-red-50 border border-red-200 rounded-md px-4 py-2"
                    >
                      <div>
                        <span className="text-sm text-gray-900">
                          {sub?.title ?? r.subtopic_id.slice(0, 8)}
                        </span>
                        <p className="text-xs text-gray-500">
                          {lo?.code} {lo?.title}
                        </p>
                      </div>
                      <span className="text-sm">
                        {r.correct}/{r.attempts} ·{' '}
                        <span className="font-semibold text-red-700">
                          {r.accuracy_pct}%
                        </span>
                      </span>
                    </li>
                  )
                })}
              </ul>
            </>
          )}

          {/* Question-type accuracy */}
          <h2 className="text-lg font-semibold text-gray-900 mt-10 mb-3">
            Accuracy by question type
          </h2>
          <ul className="space-y-2">
            {qtRows.map((r) => (
              <li
                key={r.question_type_id}
                className="bg-white border border-gray-200 rounded-md p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">
                    {r.question_type_label}
                  </span>
                  <span className="text-sm">
                    {r.correct}/{r.attempts} ·{' '}
                    <span className={`font-semibold ${pctColour(r.accuracy_pct)}`}>
                      {r.accuracy_pct}%
                    </span>
                  </span>
                </div>
                <div className="mt-2 h-2 bg-gray-100 rounded">
                  <div
                    className="h-2 bg-blue-500 rounded"
                    style={{
                      width: `${maxQtAttempts ? (r.attempts / maxQtAttempts) * 100 : 0}%`,
                    }}
                  />
                </div>
              </li>
            ))}
            {qtRows.length === 0 && (
              <li className="text-sm text-gray-500">
                No quiz attempts recorded yet.
              </li>
            )}
          </ul>

          {/* Session history */}
          <h2 className="text-lg font-semibold text-gray-900 mt-10 mb-3">
            Recent sessions
          </h2>
          {loQuizSessions.length === 0 && domainExamSessions.length === 0 ? (
            <p className="text-sm text-gray-500">No completed sessions yet.</p>
          ) : (
            <ul className="space-y-2">
              {[
                ...domainExamSessions.map((s) => ({ ...s, _kind: 'domain' })),
                ...loQuizSessions.map((s) => ({ ...s, _kind: 'lo' })),
              ]
                .sort(
                  (a, b) =>
                    new Date(b.completed_at).getTime() -
                    new Date(a.completed_at).getTime()
                )
                .map((s) => {
                  const pct = s.total_questions
                    ? Math.round((s.correct_count / s.total_questions) * 100)
                    : null
                  const label =
                    s._kind === 'domain'
                      ? `Domain Exam · ${domainsById[s.domain_id]?.code ?? ''} ${
                          domainsById[s.domain_id]?.title ?? ''
                        }`
                      : `LO Quiz · ${losById[s.lo_id]?.code ?? ''} ${
                          losById[s.lo_id]?.title ?? ''
                        }`
                  return (
                    <li
                      key={s.id}
                      className="flex items-center justify-between bg-white border border-gray-200 rounded-md px-4 py-2"
                    >
                      <div>
                        <p className="text-sm text-gray-900">{label}</p>
                        <p className="text-xs text-gray-500">
                          {fmtDate(s.completed_at)} ·{' '}
                          {s.time_taken_seconds
                            ? `${Math.floor(s.time_taken_seconds / 60)}m ${
                                s.time_taken_seconds % 60
                              }s`
                            : ''}
                        </p>
                      </div>
                      <span className="text-sm">
                        {s.correct_count}/{s.total_questions} ·{' '}
                        <span className={`font-semibold ${pctColour(pct)}`}>
                          {pct != null ? `${pct}%` : '—'}
                        </span>
                      </span>
                    </li>
                  )
                })}
            </ul>
          )}
        </>
      )}
    </PageWrapper>
  )
}
