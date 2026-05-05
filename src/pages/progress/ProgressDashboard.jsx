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
  const [examData, setExamData] = useState([]) 
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        // 1. Fetch enrollments and exam tree for basic display names
        const { data: enrollments, error: enrollErr } = await supabase
          .from('enrollments')
          .select(
            'exam_id, exams(id, code, title, domains(id, code, title, sort_order, los(id, code, title, sort_order)))'
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

        // 2. Prepare data for each exam using the RPC
        const built = []
        for (const ex of exams) {
          // Parallel call: RPC for accuracy and standard queries for history[cite: 9]
          const [rpcRes, lqsRes, desRes] = await Promise.all([
            supabase.rpc('get_exam_progress', { p_user_id: user.id, p_exam_id: ex.id }),
            supabase
              .from('lo_quiz_sessions')
              .select('id, lo_id, status, correct_count, total_questions, completed_at, sessions!inner(user_id, exam_id)')
              .eq('sessions.user_id', user.id)
              .eq('sessions.exam_id', ex.id)
              .eq('status', 'completed'),
            supabase
              .from('domain_exam_sessions')
              .select('id, domain_id, status, correct_count, total_questions, completed_at, sessions!inner(user_id, exam_id)')
              .eq('sessions.user_id', user.id)
              .eq('sessions.exam_id', ex.id)
              .eq('status', 'completed')
          ])

          if (rpcRes.error) throw rpcRes.error

          // Format Domain Data from RPC[cite: 9]
          const perDomain = (rpcRes.data ?? []).map(d => ({
            domain: { id: d.domain_id, code: d.domain_code, title: d.domain_title },
            attempts: parseInt(d.attempts),
            correct: parseInt(d.correct),
            pct: d.attempts > 0 ? Math.round((d.correct / d.attempts) * 1000) / 10 : null
          }))

          // Derived Totals[cite: 9]
          const attempts = perDomain.reduce((a, b) => a + b.attempts, 0)
          const correct = perDomain.reduce((a, b) => a + b.correct, 0)
          const pct = attempts > 0 ? Math.round((correct / attempts) * 1000) / 10 : null

          // Mapping helpers for the session list[cite: 9]
          const flatLos = ex.domains.flatMap(d => d.los)
          const losById = Object.fromEntries(flatLos.map(l => [l.id, l]))
          const domainsById = Object.fromEntries(ex.domains.map(d => [d.id, d]))

          built.push({
            exam: ex,
            perDomain,
            loQuizSessions: lqsRes.data ?? [],
            domainExamSessions: desRes.data ?? [],
            attempts,
            correct,
            pct,
            losById,
            domainsById
          })
        }

        if (!cancelled) setExamData(built)
      } catch (e) {
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [user])

  // Overall Headline aggregates[cite: 9]
  const totalAttempts = examData.reduce((a, e) => a + e.attempts, 0)
  const totalCorrect = examData.reduce((a, e) => a + e.correct, 0)
  const totalPct = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 1000) / 10 : null
  const totalLoQuizzes = examData.reduce((a, e) => a + e.loQuizSessions.length, 0)
  const totalDomainExams = examData.reduce((a, e) => a + e.domainExamSessions.length, 0)

  return (
    <PageWrapper>
      <h1 className="text-2xl font-bold text-gray-900">Progress</h1>
      
      {loading && <LoadingState />}
      {error && <p className="text-red-600 text-sm mt-6">{error}</p>}

      {!loading && !error && examData.length > 0 && (
        <>
          <div className="mt-6 grid sm:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <p className="text-xs uppercase tracking-wide text-gray-500">Overall accuracy</p>
              <p className={`mt-2 text-3xl font-bold ${pctColour(totalPct)}`}>
                {totalPct != null ? `${totalPct}%` : '—'}
              </p>
              <p className="text-xs text-gray-500 mt-1">{totalCorrect} / {totalAttempts} answers</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <p className="text-xs uppercase tracking-wide text-gray-500">LO quizzes</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{totalLoQuizzes}</p>
              <p className="text-xs text-gray-500 mt-1">completed</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <p className="text-xs uppercase tracking-wide text-gray-500">Domain exams</p>
              <p className={`mt-2 text-3xl font-bold text-gray-900`}>{totalDomainExams}</p>
              <p className="text-xs text-gray-500 mt-1">completed</p>
            </div>
          </div>

          {examData.map((ex) => <ExamSection key={ex.exam.id} data={ex} />)}
        </>
      )}
    </PageWrapper>
  )
}

function ExamSection({ data }) {
  const { exam, perDomain, loQuizSessions, domainExamSessions, losById, domainsById, attempts, correct, pct } = data

  const sessions = [
    ...domainExamSessions.map((s) => ({ ...s, _kind: 'domain' })),
    ...loQuizSessions.map((s) => ({ ...s, _kind: 'lo' })),
  ].sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())

  return (
    <section className="mt-10 bg-white border border-gray-200 rounded-lg overflow-hidden">
      <header className="px-5 py-4 border-b border-gray-200 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <span className="text-xs font-mono text-gray-500">{exam.code}</span>
          <h2 className="font-semibold text-gray-900">{exam.title}</h2>
        </div>
        <span className="text-sm">
          {correct}/{attempts} · <span className={`font-semibold ${pctColour(pct)}`}>{pct != null ? `${pct}%` : '—'}</span>
        </span>
      </header>

      <div className="px-5 py-5 space-y-8">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Accuracy by domain</h3>
          <ul className="space-y-2">
            {perDomain.map((d) => (
              <li key={d.domain.id} className="flex items-center justify-between border border-gray-200 rounded-md px-4 py-2 hover:bg-gray-50">
                <span className="text-sm text-gray-900">{d.domain.title}</span>
                <span className="text-sm font-medium">{d.correct}/{d.attempts} · <span className={pctColour(d.pct)}>{d.pct != null ? `${d.pct}%` : '—'}</span></span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Recent sessions</h3>
          {sessions.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No completed sessions yet.</p>
          ) : (
            <ul className="space-y-2">
              {sessions.map((s) => {
                const p = s.total_questions ? Math.round((s.correct_count / s.total_questions) * 100) : null
                const label = s._kind === 'domain' 
                  ? `Domain Exam · ${domainsById[s.domain_id]?.title ?? ''}` 
                  : `LO Quiz · ${losById[s.lo_id]?.title ?? ''}`
                return (
                  <li key={s.id} className="flex items-center justify-between border border-gray-200 rounded-md px-4 py-2 hover:bg-gray-50">
                    <div>
                      <p className="text-sm text-gray-900 font-medium">{label}</p>
                      <p className="text-xs text-gray-500">{fmtDate(s.completed_at)}</p>
                    </div>
                    <span className="text-sm font-medium">
                      {s.correct_count}/{s.total_questions} · <span className={pctColour(p)}>{p != null ? `${p}%` : '—'}</span>
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