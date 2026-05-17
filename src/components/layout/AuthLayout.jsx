import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase.js'

export default function AuthLayout({ children }) {
  const [exams, setExams] = useState([])

  useEffect(() => {
    supabase
      .from('exams')
      .select('id, code, title, provider')
      .eq('status', 'published')
      .order('code')
      .then(({ data }) => setExams(data ?? []))
  }, [])

  return (
    <div className="min-h-screen flex">
      {/* Left panel — exam showcase */}
      <div className="hidden lg:flex flex-col justify-center bg-blue-700 text-white w-5/12 px-12 py-16">
        <h2 className="text-3xl font-bold mb-2">Prepare smarter.</h2>
        <p className="text-blue-200 mb-10 text-sm">
          Practice questions, timed exams, and detailed explanations — all in one place.
        </p>

        <p className="text-xs font-semibold uppercase tracking-widest text-blue-300 mb-4">
          Available exams
        </p>

        <ul className="space-y-3">
          {exams.map((exam) => (
            <li key={exam.id} className="bg-blue-800 bg-opacity-50 rounded-lg px-4 py-3">
              <span className="block text-xs font-mono text-blue-300 mb-0.5">{exam.code}</span>
              <span className="block text-sm font-medium leading-snug">{exam.title}</span>
              <span className="block text-xs text-blue-300 mt-0.5">{exam.provider}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Right panel — auth form */}
      <div className="flex flex-1 items-center justify-center bg-gray-50 px-4">
        {children}
      </div>
    </div>
  )
}
