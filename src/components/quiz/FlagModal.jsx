import { useState } from 'react'
import { supabase } from '../../lib/supabase.js'
import { useAuth } from '../../hooks/useAuth.jsx'
import { useToast } from '../../hooks/useToast.jsx'
import Modal from '../ui/Modal.jsx'

const REASONS = [
  { value: 'wrong_answer', label: 'Wrong answer marked as correct' },
  { value: 'outdated',     label: 'Outdated information' },
  { value: 'duplicate',    label: 'Duplicate of another question' },
  { value: 'unclear',      label: 'Unclear or ambiguous wording' },
]

export default function FlagModal({ open, questionId, onClose }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [reason, setReason] = useState('wrong_answer')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(null) // 'thanks' | 'already' | 'error'
  const [errorMsg, setErrorMsg] = useState(null)

  function reset() {
    setReason('wrong_answer')
    setSubmitting(false)
    setDone(null)
    setErrorMsg(null)
  }

  async function submit() {
    setSubmitting(true)
    const { error } = await supabase.from('flags').insert({
      user_id: user.id,
      question_id: questionId,
      reason,
    })
    setSubmitting(false)
    if (error) {
      // 23505 is Postgres unique-violation — flagged already
      if (error.code === '23505' || /duplicate|unique/i.test(error.message)) {
        setDone('already')
      } else {
        setErrorMsg(error.message)
        setDone('error')
      }
      return
    }
    toast('Question reported — thanks for flagging.')
    setDone('thanks')
  }

  function close() {
    reset()
    onClose()
  }

  return (
    <Modal
      open={open}
      title="Report this question"
      actions={
        done ? (
          <button
            onClick={close}
            className="text-sm px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white"
          >
            Close
          </button>
        ) : (
          <>
            <button
              onClick={close}
              className="text-sm px-4 py-2 rounded-md border border-gray-200 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={submitting}
              className="text-sm px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            >
              {submitting ? 'Submitting…' : 'Submit report'}
            </button>
          </>
        )
      }
    >
      {!done && (
        <>
          <p className="text-gray-600 mb-3">What's wrong with this question?</p>
          <ul className="space-y-2">
            {REASONS.map((r) => (
              <li key={r.value}>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="flag-reason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={(e) => setReason(e.target.value)}
                  />
                  <span>{r.label}</span>
                </label>
              </li>
            ))}
          </ul>
        </>
      )}
      {done === 'thanks' && (
        <p className="text-green-700">
          Thank you — this question has been reported for review.
        </p>
      )}
      {done === 'already' && (
        <p className="text-gray-700">
          You've already reported this question. We'll get to it.
        </p>
      )}
      {done === 'error' && (
        <p className="text-red-700">Couldn't submit: {errorMsg}</p>
      )}
    </Modal>
  )
}
