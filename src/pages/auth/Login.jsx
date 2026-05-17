import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.jsx'
import { supabase } from '../../lib/supabase.js'
import AuthLayout from '../../components/layout/AuthLayout.jsx'

const VIEW = {
  LOGIN: 'login',
  FORGOT: 'forgot',
  OTP: 'otp',
  RESET: 'reset',
}

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const [view, setView] = useState(VIEW.LOGIN)

  // login
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // forgot / otp / reset
  const [resetEmail, setResetEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')

  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  function reset() {
    setError(null)
    setInfo(null)
  }

  // ── Login ────────────────────────────────────────────────────
  async function handleLogin(e) {
    e.preventDefault()
    reset()
    setSubmitting(true)
    const { error } = await signIn(email, password)
    setSubmitting(false)
    if (error) { setError(error.message); return }
    navigate('/exams', { replace: true })
  }

  // ── Forgot: send OTP ─────────────────────────────────────────
  async function handleSendOtp(e) {
    e.preventDefault()
    reset()
    setSubmitting(true)
    const { error } = await supabase.auth.signInWithOtp({
      email: resetEmail,
      options: { shouldCreateUser: false },
    })
    setSubmitting(false)
    if (error) { setError(error.message); return }
    setInfo(`OTP sent to ${resetEmail}. Check your inbox.`)
    setView(VIEW.OTP)
  }

  // ── OTP: verify ──────────────────────────────────────────────
  async function handleVerifyOtp(e) {
    e.preventDefault()
    reset()
    setSubmitting(true)
    const { error } = await supabase.auth.verifyOtp({
      email: resetEmail,
      token: otp,
      type: 'email',
    })
    setSubmitting(false)
    if (error) { setError(error.message); return }
    setView(VIEW.RESET)
  }

  // ── Reset: set new password ──────────────────────────────────
  async function handleResetPassword(e) {
    e.preventDefault()
    reset()
    setSubmitting(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setSubmitting(false)
    if (error) { setError(error.message); return }
    navigate('/exams', { replace: true })
  }

  // ── Render ───────────────────────────────────────────────────
  return (
    <AuthLayout>
      <div className="w-full max-w-sm bg-white shadow rounded-lg p-8 space-y-5">

        {/* ── Login view ── */}
        {view === VIEW.LOGIN && (
          <form onSubmit={handleLogin} className="space-y-5">
            <h1 className="text-2xl font-bold text-gray-900">Log in</h1>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <button
                  type="button"
                  onClick={() => { reset(); setView(VIEW.FORGOT) }}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-md disabled:opacity-50"
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>

            <p className="text-sm text-gray-600 text-center">
              No account?{' '}
              <Link to="/signup" className="text-blue-600 hover:underline">
                Sign up
              </Link>
            </p>
          </form>
        )}

        {/* ── Forgot: enter email ── */}
        {view === VIEW.FORGOT && (
          <form onSubmit={handleSendOtp} className="space-y-5">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Forgot password</h1>
              <p className="text-sm text-gray-500 mt-1">
                Enter your email and we'll send a one-time code.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-md disabled:opacity-50"
            >
              {submitting ? 'Sending…' : 'Send OTP'}
            </button>

            <p className="text-sm text-gray-600 text-center">
              <button
                type="button"
                onClick={() => { reset(); setView(VIEW.LOGIN) }}
                className="text-blue-600 hover:underline"
              >
                Back to log in
              </button>
            </p>
          </form>
        )}

        {/* ── OTP: verify ── */}
        {view === VIEW.OTP && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Enter OTP</h1>
              {info && <p className="text-sm text-green-700 mt-1">{info}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                6-digit code
              </label>
              <input
                type="text"
                required
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 tracking-widest text-center text-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="······"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={submitting || otp.length < 6}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-md disabled:opacity-50"
            >
              {submitting ? 'Verifying…' : 'Verify'}
            </button>

            <p className="text-sm text-gray-600 text-center">
              <button
                type="button"
                onClick={() => { reset(); setView(VIEW.FORGOT) }}
                className="text-blue-600 hover:underline"
              >
                Resend OTP
              </button>
            </p>
          </form>
        )}

        {/* ── Reset: set new password ── */}
        {view === VIEW.RESET && (
          <form onSubmit={handleResetPassword} className="space-y-5">
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
