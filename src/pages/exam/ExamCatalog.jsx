import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import PageWrapper from '../../components/layout/PageWrapper.jsx'
import { LoadingState } from '../../components/ui/Spinner.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'

export default function ExamCatalog() {
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data, error } = await supabase
        .from('exams')
        .select('id, code, title, provider, version, domains(id)')
        .eq('status', 'published')
        .order('code')
      if (cancelled) return
      if (error) setError(error.message)
      else setExams(data ?? [])
      setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <PageWrapper>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Exams</h1>

      {loading && <LoadingState label="Loading exams…" />}
      {error && <p className="text-red-600 text-sm">{error}</p>}

      {!loading && !error && exams.length === 0 && (
        <EmptyState
          title="No published exams yet"
          description="Once an exam is published, you'll be able to enroll here."
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {exams.map((exam) => (
          <Link
            key={exam.id}
            to={`/exams/${exam.id}`}
            className="bg-white border border-gray-200 hover:border-blue-400 hover:shadow-md transition rounded-lg p-5 block"
          >
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-mono text-gray-500">{exam.code}</span>
              <span className="text-xs text-gray-400">{exam.provider}</span>
            </div>
            <h2 className="mt-2 font-semibold text-gray-900">{exam.title}</h2>
            <p className="mt-3 text-sm text-gray-500">
              {exam.domains?.length ?? 0} domain
              {(exam.domains?.length ?? 0) === 1 ? '' : 's'}
              {exam.version ? ` · ${exam.version}` : ''}
            </p>
          </Link>
        ))}
      </div>
    </PageWrapper>
  )
}
