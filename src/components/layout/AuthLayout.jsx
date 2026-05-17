import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase.js'

export default function AuthLayout({ children }) {
  const [exams, setExams] = useState([])
  const [mobileOpen, setMobileOpen] = useState(false)

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
      {/* Left panel — desktop only */}
      <div className="hidden lg:flex flex-col justify-center bg-blue-700 text-white w-5/12 px-12 py-16 overflow-y-auto">
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
      <div className="flex flex-1 flex-col items-center justify-center bg-gray-50 px-4 py-8">

        {/* Mobile header + exam strip — hidden on lg+ */}
        <div className="lg:hidden w-full max-w-sm mb-4">
          <div className="mb-3">
            <h2 className="text-xl font-bold text-gray-900">Prepare smarter.</h2>
            <p className="text-sm text-gray-500">Practice questions, timed exams, and detailed explanations — all in one place.</p>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            className="w-full flex items-center justify-between bg-blue-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg"
          >
            <span className="flex items-center gap-2">
              <span>🎓</span>
              <span>Exams you can prepare</span>
            </span>
            <span className="text-blue-200 text-xs">{mobileOpen ? '▲ Hide' : '▼ Show'}</span>
          </button>

          {mobileOpen && (
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {exams.map((exam) => (
                <div
                  key={exam.id}
                  className="flex-shrink-0 bg-white border border-blue-100 rounded-lg px-3 py-2.5 w-44 shadow-sm"
                >
                  <span className="block text-xs font-mono text-blue-500 mb-0.5">{exam.code}</span>
                  <span className="block text-xs font-medium text-gray-800 leading-snug">{exam.title}</span>
                  <span className="block text-xs text-gray-400 mt-1">{exam.provider}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {children}
      </div>
    </div>
  )
}
