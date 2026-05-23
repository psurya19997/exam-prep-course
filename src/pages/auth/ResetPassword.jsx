import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import AuthLayout from '../../components/layout/AuthLayout.jsx'

const STATUS = {
  WAITING: 'waiting',   // parsing the recovery token from URL
  READY: 'ready',       // PASSWORD_RECOVERY event received, show form
  EXPIRED: 'expired',   // link expired or invalid
}

export default function ResetPassword() {
  const navigate = useNavigate()
  const [status, setStatus] = useState(STATUS.WAITING)
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setStatus(STATUS.READY)
      }
    })

    // If the token is missing or already expired, Supabase won't fire
    // PASSWORD_RECOVERY. Show an error after a short grace period.
    const timeout = setTimeout(() => {
      setStatus((current) => {
        if (current === STATUS.WAITING) return STATUS.EXPIRED
        return current
      })
    }, 4000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setSubmitting(false)
    if (error) { setError(error.message); return }
    navigate('/login', {
      replace: true,
      state: { message: 'Password updated successfully. Please log in.' },
    })
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-sm bg-white shadow rounded-lg p-8 space-y-5">

        {status === STATUS.WAITING && (
          <p className="text-sm text-gray-500">Verifying reset link…</p>
        )}

        {status === STATUS.EXPIRED && (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-gray-900">Link expired</h1>
            <p className="text-sm text-red-600">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-md"
            >
              Back to log in
            </button>
          </div>
        )}

        {status === STATUS.READY && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Set new password</h1>
              <p className="text-sm text-gray-500 mt-1">Choose a new password for your account.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-md disabled:opacity-50"
            >
              {submitting ? 'Saving…' : 'Save password'}
            </button>
          </form>
        )}

      </div>
    </AuthLayout>
  )
}
