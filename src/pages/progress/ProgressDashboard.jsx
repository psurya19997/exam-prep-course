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
  const [examData, setExamData] = useState([]) // one entry per enrolled exam
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const { data: enrollments, error: enrollErr } = await supabase
          .from('enrollments')
          .select(
            'exam_id, exams(id, code, title, domains(id, code, title, sort_order, los(id, code, title, sort_order, subtopics(id, code, title))))'
          )
          .eq('user_id', user.id)
        if (enrollErr) throw enrollErr

        const exams = (enrollments ?? [])
          .map((e) => e.exams)
          .filter(Boolean)
        if (exams.length === 0) {
          if (!cancelled) {
            setExamData([])
            setLoading(false)
          }
          return
        }

        for (const ex of exams) {
          ex.domains.sort((a, b) => a.sort_order - b.sort_order)
          ex.domains.forEach((d) =>
            d.los.sort((a, b) => a.sort_order - b.sort_order)
          )
        }

        // Fetch per-exam metric rows in parallel: 4 queries × N exams
        const requests = exams.flatMap((ex) => [
          supabase
            .from('subtopic_accuracy')
            .select('*')
            .eq('user_id', user.id)
            .eq('exam_id', ex.id),
          supabase
            .from('question_type_accuracy')
            .select('*')
            .eq('user_id', user.id)
            .eq('exam_id', ex.id),
          supabase
            .from('lo_quiz_sessions')
            .select(
              'id, lo_id, status, correct_count, total_questions, time_taken_seconds, completed_at, sessions!inner(user_id, exam_id)'
            )
            .eq('sessions.user_id', user.id)
            .eq('sessions.exam_id', ex.id)
            .eq('status', 'completed')
            .order('completed_at', { ascending: false }),
          supabase
            .from('domain_exam_sessions')
            .select(
              'id, domain_id, status, correct_count, total_questions, time_taken_seconds, completed_at, sessions!inner(user_id, exam_id)'
            )
            .eq('sessions.user_id', user.id)
            .eq('sessions.exam_id', ex.id)
            .eq('status', 'completed')
            .order('completed_at', { ascending: false }),
        ])

        const responses = await Promise.all(requests)
        if (cancelled) return

        const built = exams.map((ex, i) => {
          const subRows = responses[i * 4]?.data ?? []
          const qtRows = responses[i * 4 + 1]?.data ?? []
          const loQuizSessions = responses[i * 4 + 2]?.data ?? []
          const domainExamSessions = responses[i * 4 + 3]?.data ?? []

          const flatLos = ex.domains.flatMap((d) => d.los)
          const flatSubs = flatLos.flatMap((l) => l.subtopics ?? [])
          const losById = Object.fromEntries(flatLos.map((l) => [l.id, l]))
          const subtopicsById = Object.fromEntries(
            flatSubs.map((s) => [s.id, s])
          )
          const domainsById = Object.fromEntries(
            ex.domains.map((d) => [d.id, d])
          )

          const perDomainMap = {}
          for (const d of ex.domains) {
            perDomainMap[d.id] = { attempts: 0, correct: 0, domain: d }
          }
          for (const r of subRows) {
            if (!perDomainMap[r.domain_id]) continue
            perDomainMap[r.domain_id].attempts += r.attempts
            perDomainMap[r.domain_id].correct += r.correct
          }
          const perDomain = Object.values(perDomainMap).map((m) => ({
            ...m,
            pct: m.attempts
              ? Math.round((m.correct / m.attempts) * 1000) / 10
              : null,
          }))

          const attempts = subRows.reduce((a, r) => a + r.attempts, 0)
          const correct = subRows.reduce((a, r) => a + r.correct, 0)
          const pct = attempts
            ? Math.round((correct / attempts) * 1000) / 10
            : null

          return {
            exam: ex,
            subRows,
            qtRows,
            loQuizSessions,
            domainExamSessions,
            perDomain,
            attempts,
            correct,
            pct,
            losById,
            subtopicsById,
            domainsById,
          }
        })
        setExamData(built)
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
  }, [user])

  // Cross-exam aggregates for the headline
  const totalAttempts = examData.reduce((a, e) => a + e.attempts, 0)
  const totalCorrect = examData.reduce((a, e) => a + e.correct, 0)
  const totalPct = totalAttempts
    ? Math.round((totalCorrect / totalAttempts) * 1000) / 10
    : null
  const totalLoQuizzes = examData.reduce(
    (a, e) => a + e.loQuizSessions.length,
    0
  )
  const totalDomainExams = examData.reduce(
    (a, e) => a + e.domainExamSessions.length,
    0
  )

  // Global weakest subtopics across all exams
  const allSubRowsWithCtx = examData.flatMap((e) =>
    e.subRows.map((r) => ({
      ...r,
      _examCode: e.exam.code,
      _sub: e.subtopicsById[r.subtopic_id],
      _lo: e.losById[r.lo_id],
    }))
  )
  const weakest = allSubRowsWithCtx
    .filter((r) => r.accuracy_pct < 60)
    .sort((a, b) => a.accuracy_pct - b.accuracy_pct)
    .slice(0, 5)

  return (
    <PageWrapper>
      <h1 className="text-2xl font-bold text-gray-900">Progress</h1>
      {examData.length > 1 && (
        <p className="mt-1 text-sm text-gray-500">
          Headline stats aggregate across all {examData.length} enrolled exams.
        </p>
      )}

      {loading && <LoadingState />}
      {error && <p className="text-red-600 text-sm mt-6">{error}</p>}

      {!loading && !error && examData.length === 0 && (
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

      {!loading && !error && examData.length > 0 && (
        <>
          <div className="mt-6 grid sm:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Overall accuracy
              </p>
              <p className={`mt-2 text-3xl font-bold ${pctColour(totalPct)}`}>
                {totalPct != null ? `${totalPct}%` : '—'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {totalCorrect} / {totalAttempts} answers · all exams
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                LO quizzes
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {totalLoQuizzes}
              </p>
              <p className="text-xs text-gray-500 mt-1">completed · all exams</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Domain exams
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {totalDomainExams}
              </p>
              <p className="text-xs text-gray-500 mt-1">completed · all exams</p>
            </div>
          </div>

          {weakest.length > 0 && (
            <>
              <h2 className="text-lg font-semibold text-gray-900 mt-10 mb-3">
                Weakest subtopics (under 60%, across all exams)
              </h2>
              <ul className="space-y-2">
                {weakest.map((r) => (
                  <li
                    key={`${r._examCode}-${r.subtopic_id}`}
                    className="flex items-center justify-between bg-red-50 border border-red-200 rounded-md px-4 py-2"
                  >
                    <div>
                      <span className="text-sm text-gray-900">
                        {r._sub?.title ?? r.subtopic_id.slice(0, 8)}
                      </span>
                      <p className="text-xs text-gray-500">
                        {r._examCode} · {r._lo?.code} {r._lo?.title}
                      </p>
                    </div>
                    <span className="text-sm">
                      {r.correct}/{r.attempts} ·{' '}
                      <span className="font-semibold text-red-700">
                        {r.accuracy_pct}%
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}

          {examData.map((ex) => (
            <ExamSection key={ex.exam.id} data={ex} />
          ))}
        </>
      )}
    </PageWrapper>
  )
}

function ExamSection({ data }) {
  const {
    exam,
    perDomain,
    qtRows,
    loQuizSessions,
    domainExamSessions,
    losById,
    domainsById,
    attempts,
    correct,
    pct,
  } = data
  const maxQtAttempts = Math.max(0, ...qtRows.map((r) => r.attempts))

  const sessions = [
    ...domainExamSessions.map((s) => ({ ...s, _kind: 'domain' })),
    ...loQuizSessions.map((s) => ({ ...s, _kind: 'lo' })),
  ].sort(
    (a, b) =>
      new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
  )

  return (
    <section className="mt-10 bg-white border border-gray-200 rounded-lg overflow-hidden">
      <header className="px-5 py-4 border-b border-gray-200 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <span className="text-xs font-mono text-gray-500">{exam.code}</span>
          <h2 className="font-semibold text-gray-900">{exam.title}</h2>
        </div>
        <span className="text-sm">
          {correct}/{attempts} ·{' '}
          <span className={`font-semibold ${pctColour(pct)}`}>
            {pct != null ? `${pct}%` : '—'}
          </span>
        </span>
      </header>

      <div className="px-5 py-5 space-y-8">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">
            Accuracy by domain
          </h3>
          <ul className="space-y-2">
            {perDomain.map((d) => (
              <li
                key={d.domain.id}
                className="flex items-center justify-between border border-gray-200 rounded-md px-4 py-2"
              >
                <div>
                  <span className="text-xs font-mono text-gray-500">
                    {d.domain.code}
                  </span>{' '}
                  <span className="text-sm text-gray-900">
                    {d.domain.title}
                  </span>
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
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">
            Accuracy by question type
          </h3>
          <ul className="space-y-2">
            {qtRows.map((r) => (
              <li
                key={r.question_type_id}
                className="border border-gray-200 rounded-md p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">
                    {r.question_type_label}
                  </span>
                  <span className="text-sm">
                    {r.correct}/{r.attempts} ·{' '}
                    <span
                      className={`font-semibold ${pctColour(r.accuracy_pct)}`}
                    >
                      {r.accuracy_pct}%
                    </span>
                  </span>
                </div>
                <div className="mt-2 h-2 bg-gray-100 rounded">
                  <div
                    className="h-2 bg-blue-500 rounded"
                    style={{
                      width: `${
                        maxQtAttempts ? (r.attempts / maxQtAttempts) * 100 : 0
                      }%`,
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
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">
            Recent sessions
          </h3>
          {sessions.length === 0 ? (
            <p className="text-sm text-gray-500">No completed sessions yet.</p>
          ) : (
            <ul className="space-y-2">
              {sessions.map((s) => {
                const p = s.total_questions
                  ? Math.round((s.correct_count / s.total_questions) * 100)
                  : null
                const label =
                  s._kind === 'domain'
                    ? `Domain Exam · ${
                        domainsById[s.domain_id]?.code ?? ''
                      } ${domainsById[s.domain_id]?.title ?? ''}`
                    : `LO Quiz · ${losById[s.lo_id]?.code ?? ''} ${
                        losById[s.lo_id]?.title ?? ''
                      }`
                return (
                  <li
                    key={s.id}
                    className="flex items-center justify-between border border-gray-200 rounded-md px-4 py-2"
                  >
                    <div>
                      <p className="text-sm text-gray-900">{label}</p>
                      <p className="text-xs text-gray-500">
                        {fmtDate(s.completed_at)}
                        {s.time_taken_seconds
                          ? ` · ${Math.floor(s.time_taken_seconds / 60)}m ${
                              s.time_taken_seconds % 60
                            }s`
                          : ''}
                      </p>
                    </div>
                    <span className="text-sm">
                      {s.correct_count}/{s.total_questions} ·{' '}
                      <span className={`font-semibold ${pctColour(p)}`}>
                        {p != null ? `${p}%` : '—'}
                      </span>
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
