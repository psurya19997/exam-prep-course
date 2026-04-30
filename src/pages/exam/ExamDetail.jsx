import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { useAuth } from '../../hooks/useAuth.jsx'
import { useToast } from '../../hooks/useToast.jsx'
import PageWrapper from '../../components/layout/PageWrapper.jsx'
import { LoadingState } from '../../components/ui/Spinner.jsx'

export default function ExamDetail() {
  const { examId } = useParams()
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [exam, setExam] = useState(null)
  const [enrolled, setEnrolled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [enrolling, setEnrolling] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const examQuery = supabase
        .from('exams')
        .select(
          'id, code, title, provider, version, passing_score, status, domains(id, code, title, weight_percent, sort_order, los(id))'
        )
        .eq('id', examId)
        .eq('status', 'published')
        .single()

      const enrollQuery = supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('exam_id', examId)
        .maybeSingle()

      const [{ data: examData, error: examErr }, { data: enrollData }] =
        await Promise.all([examQuery, enrollQuery])

      if (cancelled) return
      if (examErr) setError(examErr.message)
      else {
        examData?.domains?.sort((a, b) => a.sort_order - b.sort_order)
        setExam(examData)
      }
      setEnrolled(Boolean(enrollData))
      setLoading(false)
    }
    if (user) load()
    return () => {
      cancelled = true
    }
  }, [examId, user])

  async function handleEnroll() {
    setEnrolling(true)
    const { error } = await supabase
      .from('enrollments')
      .insert({ user_id: user.id, exam_id: examId })
    setEnrolling(false)
    if (error) {
      setError(error.message)
      toast({ tone: 'error', message: `Couldn't enroll: ${error.message}` })
      return
    }
    toast(`Enrolled in ${exam?.code ?? 'exam'}. Let's get started.`)
    navigate(`/study/${examId}`)
  }

  return (
    <PageWrapper>
      <Link to="/exams" className="text-sm text-blue-600 hover:underline">
        ← All exams
      </Link>

      {loading && <LoadingState />}
      {error && <p className="text-red-600 text-sm mt-4">{error}</p>}

      {exam && (
        <div className="mt-4">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-mono text-gray-500">{exam.code}</span>
            <span className="text-xs text-gray-400">{exam.provider}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">{exam.title}</h1>
          {exam.passing_score && (
            <p className="text-sm text-gray-500 mt-1">
              Passing score: {exam.passing_score}
            </p>
          )}

          <div className="mt-6">
            {enrolled ? (
              <Link
                to={`/study/${exam.id}`}
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-md"
              >
                Go to Study
              </Link>
            ) : (
              <button
                onClick={handleEnroll}
                disabled={enrolling}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-md disabled:opacity-50"
              >
                {enrolling ? 'Enrolling…' : 'Enroll'}
              </button>
            )}
          </div>

          <h2 className="text-lg font-semibold text-gray-900 mt-10 mb-3">
            Domains
          </h2>
          <ul className="space-y-3">
            {(exam.domains ?? []).map((d) => (
              <li
                key={d.id}
                className="bg-white border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-xs font-mono text-gray-500">
                      {d.code}
                    </span>
                    <h3 className="font-medium text-gray-900">{d.title}</h3>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    <p>{d.los?.length ?? 0} LOs</p>
                    {d.weight_percent != null && <p>{d.weight_percent}%</p>}
                  </div>
                </div>
              </li>
            ))}
            {(exam.domains ?? []).length === 0 && (
              <li className="text-sm text-gray-500">No domains yet.</li>
            )}
          </ul>
        </div>
      )}
    </PageWrapper>
  )
}
