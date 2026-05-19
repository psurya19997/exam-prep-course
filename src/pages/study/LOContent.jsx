import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { useAuth } from '../../hooks/useAuth.jsx'
import { useToast } from '../../hooks/useToast.jsx'
import PageWrapper from '../../components/layout/PageWrapper.jsx'
import { LoadingState } from '../../components/ui/Spinner.jsx'
import { Markdown } from '../../lib/markdown.jsx'

export default function LOContent() {
  const { examId, loId } = useParams()
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [lo, setLO] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [completing, setCompleting] = useState(false)
  const [alreadyComplete, setAlreadyComplete] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)

      const loPromise = supabase
        .from('los')
        .select('id, code, title, exam_tip_summary, content, domain_id')
        .eq('id', loId)
        .single()

      const progPromise = supabase
        .from('content_progress')
        .select('id, is_completed, sessions!inner(user_id, exam_id)')
        .eq('lo_id', loId)
        .eq('is_completed', true)
        .eq('sessions.user_id', user.id)
        .eq('sessions.exam_id', examId)
        .limit(1)

      const [{ data: loData, error: loErr }, { data: progRows }] =
        await Promise.all([loPromise, progPromise])

      if (cancelled) return
      if (loErr) setError(loErr.message)
      else setLO(loData)
      setAlreadyComplete((progRows ?? []).length > 0)
      setLoading(false)
    }
    if (user) load()
    return () => {
      cancelled = true
    }
  }, [examId, loId, user])

  async function handleComplete() {
    setCompleting(true)
    try {
      const { data: session, error: sessErr } = await supabase
        .from('sessions')
        .insert({
          user_id: user.id,
          exam_id: examId,
          session_type: 'content',
        })
        .select()
        .single()
      if (sessErr) throw sessErr

      const { error: progErr } = await supabase.from('content_progress').insert({
        session_id: session.id,
        lo_id: loId,
        is_completed: true,
        completed_at: new Date().toISOString(),
      })
      if (progErr) throw progErr

      toast(`Content complete: ${lo?.code ?? 'LO'}. Quiz unlocked.`)
      navigate(`/study/${examId}/lo/${loId}/quiz`)
    } catch (e) {
      setError(e.message)
      toast({ tone: 'error', message: `Couldn't save: ${e.message}` })
      setCompleting(false)
    }
  }

  return (
    <PageWrapper>
      <Link
        to={`/study/${examId}`}
        className="no-print text-sm text-blue-600 hover:underline"
      >
        ← Study dashboard
      </Link>

      {loading && <LoadingState />}
      {error && <p className="text-red-600 text-sm mt-4">{error}</p>}

      {lo && (
        <article className="mt-4 pb-32">
          <span className="text-xs font-mono text-gray-500">{lo.code}</span>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">{lo.title}</h1>

          {lo.exam_tip_summary && (
            <div className="mt-6 bg-blue-50 border-l-4 border-blue-400 px-4 py-3 rounded-r">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">
                Exam Tip
              </p>
              <p className="text-sm text-blue-900">{lo.exam_tip_summary}</p>
            </div>
          )}

          <div className="mt-8 prose-like">
            {lo.content ? (
              <Markdown>{lo.content}</Markdown>
            ) : (
              <p className="text-gray-500 italic">No content yet for this LO.</p>
            )}
          </div>
        </article>
      )}

      {lo && (
        <div className="no-print fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 px-4 py-3">
          <div className="max-w-5xl mx-auto flex justify-end items-center gap-3">
            {alreadyComplete && (
              <span className="text-sm text-green-700">
                Already completed — clicking will create a new session
              </span>
            )}
            <button
              onClick={() => window.print()}
              className="border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium px-4 py-2 rounded-md text-sm"
            >
              ↓ Download PDF
            </button>
            <button
              onClick={handleComplete}
              disabled={completing}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-md disabled:opacity-50"
            >
              {completing ? 'Saving…' : 'Mark as Complete'}
            </button>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}
