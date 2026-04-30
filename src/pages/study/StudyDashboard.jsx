import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { useAuth } from '../../hooks/useAuth.jsx'
import PageWrapper from '../../components/layout/PageWrapper.jsx'
import Badge from '../../components/ui/Badge.jsx'
import { LoadingState } from '../../components/ui/Spinner.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'

function statusBadge(state) {
  if (state === 'complete') return <Badge tone="green">Complete</Badge>
  if (state === 'in_progress') return <Badge tone="yellow">In Progress</Badge>
  if (state === 'locked') return <Badge tone="gray">Locked</Badge>
  return <Badge tone="gray">Not Started</Badge>
}

export default function StudyDashboard() {
  const { examId } = useParams()
  const { user } = useAuth()
  const [exam, setExam] = useState(null)
  const [contentBySession, setContentBySession] = useState({})
  const [loQuiz, setLoQuiz] = useState({})
  const [domainExam, setDomainExam] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)

      const examPromise = supabase
        .from('exams')
        .select(
          'id, code, title, domains(id, code, title, sort_order, los(id, code, title, sort_order))'
        )
        .eq('id', examId)
        .single()

      const contentPromise = supabase
        .from('content_progress')
        .select('lo_id, is_completed, sessions!inner(user_id, exam_id)')
        .eq('sessions.user_id', user.id)
        .eq('sessions.exam_id', examId)

      const quizPromise = supabase
        .from('lo_quiz_sessions')
        .select('lo_id, status, sessions!inner(user_id, exam_id)')
        .eq('sessions.user_id', user.id)
        .eq('sessions.exam_id', examId)

      const domainExamPromise = supabase
        .from('domain_exam_sessions')
        .select('domain_id, status, sessions!inner(user_id, exam_id)')
        .eq('sessions.user_id', user.id)
        .eq('sessions.exam_id', examId)

      const [
        { data: examData, error: examErr },
        { data: contentRows },
        { data: quizRows },
        { data: domainExamRows },
      ] = await Promise.all([
        examPromise,
        contentPromise,
        quizPromise,
        domainExamPromise,
      ])

      if (cancelled) return
      if (examErr) {
        setError(examErr.message)
        setLoading(false)
        return
      }

      examData.domains.sort((a, b) => a.sort_order - b.sort_order)
      examData.domains.forEach((d) =>
        d.los.sort((a, b) => a.sort_order - b.sort_order)
      )
      setExam(examData)

      const contentMap = {}
      for (const r of contentRows ?? []) {
        if (r.is_completed) contentMap[r.lo_id] = 'complete'
        else if (!contentMap[r.lo_id]) contentMap[r.lo_id] = 'in_progress'
      }
      setContentBySession(contentMap)

      const quizMap = {}
      for (const r of quizRows ?? []) {
        if (r.status === 'completed') quizMap[r.lo_id] = 'complete'
        else if (r.status === 'active' && quizMap[r.lo_id] !== 'complete')
          quizMap[r.lo_id] = 'in_progress'
      }
      setLoQuiz(quizMap)

      const domainExamMap = {}
      for (const r of domainExamRows ?? []) {
        if (r.status === 'completed') domainExamMap[r.domain_id] = 'complete'
        else if (r.status === 'active' && domainExamMap[r.domain_id] !== 'complete')
          domainExamMap[r.domain_id] = 'in_progress'
      }
      setDomainExam(domainExamMap)

      setLoading(false)
    }
    if (user) load()
    return () => {
      cancelled = true
    }
  }, [examId, user])

  return (
    <PageWrapper>
      {loading && <LoadingState />}
      {error && <p className="text-red-600 text-sm">{error}</p>}

      {exam && (
        <>
          <div className="flex items-baseline justify-between">
            <h1 className="text-2xl font-bold text-gray-900">{exam.title}</h1>
            <span className="text-xs font-mono text-gray-500">{exam.code}</span>
          </div>

          {exam.domains.length === 0 && (
            <div className="mt-6">
              <EmptyState
                title="No domains yet"
                description="This exam doesn't have any domains seeded."
              />
            </div>
          )}

          <div className="mt-6 space-y-6">
            {exam.domains.map((domain) => {
              const allLOsComplete =
                domain.los.length > 0 &&
                domain.los.every((lo) => loQuiz[lo.id] === 'complete')
              const dxState =
                domainExam[domain.id] ??
                (allLOsComplete ? 'unlocked' : 'locked')
              return (
                <div
                  key={domain.id}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden"
                >
                  <div className="px-5 py-4 border-b border-gray-200 flex items-baseline justify-between">
                    <div>
                      <span className="text-xs font-mono text-gray-500">
                        {domain.code}
                      </span>
                      <h2 className="font-semibold text-gray-900">
                        {domain.title}
                      </h2>
                    </div>
                    <div className="text-sm">
                      {dxState === 'complete' ? (
                        <Badge tone="green">Domain Exam Complete</Badge>
                      ) : dxState === 'in_progress' ? (
                        <Link
                          to={`/study/${exam.id}/domain/${domain.id}/exam`}
                          className="text-blue-600 hover:underline"
                        >
                          Resume Domain Exam →
                        </Link>
                      ) : dxState === 'unlocked' ? (
                        <Link
                          to={`/study/${exam.id}/domain/${domain.id}/exam`}
                          className="text-blue-600 hover:underline"
                        >
                          Start Domain Exam →
                        </Link>
                      ) : (
                        <Badge tone="gray">Domain Exam Locked</Badge>
                      )}
                    </div>
                  </div>

                  <ul className="divide-y divide-gray-100">
                    {domain.los.map((lo) => {
                      const cState = contentBySession[lo.id] ?? 'not_started'
                      const qState = loQuiz[lo.id] ?? 'not_started'

                      return (
                        <li key={lo.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-5 py-4 hover:bg-gray-50 gap-4">
                          <div className="flex-1">
                            <span className="text-xs font-mono text-gray-500">
                              {lo.code}
                            </span>
                            <p className="text-gray-900 font-medium">
                              {lo.title}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span className="text-xs text-gray-400">Status:</span>
                              {statusBadge(cState)}
                              {statusBadge(qState)}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 w-full sm:w-auto">
                            {/* MANUAL LINK 1: Always available for View/Review */}
                            <Link
                              to={`/study/${exam.id}/lo/${lo.id}/content`}
                              className={`flex-1 sm:flex-none text-center text-xs font-medium px-3 py-2 rounded border transition-colors ${
                                cState === 'complete' 
                                  ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100' 
                                  : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                              }`}
                            >
                              {cState === 'complete' ? 'Review Notes' : 'Read Content'}
                            </Link>

                            {/* MANUAL LINK 2: Quiz (Gated by content completion) */}
                            <Link
                              to={`/study/${exam.id}/lo/${lo.id}/quiz`}
                              className={`flex-1 sm:flex-none text-center text-xs font-medium px-3 py-2 rounded border transition-colors ${
                                cState === 'complete'
                                  ? qState === 'complete'
                                    ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                                    : 'bg-white border-blue-600 text-blue-600 hover:bg-blue-50'
                                  : 'bg-gray-50 border-gray-200 text-gray-400 pointer-events-none'
                              }`}
                            >
                              {qState === 'complete' ? 'View Results' : 'Take Quiz'}
                            </Link>
                          </div>
                        </li>
                      )
                    })}
                    {domain.los.length === 0 && (
                      <li className="px-5 py-3 text-sm text-gray-500">
                        No LOs yet.
                      </li>
                    )}
                  </ul>
                </div>
              )
            })}
          </div>
        </>
      )}
    </PageWrapper>
  )
}