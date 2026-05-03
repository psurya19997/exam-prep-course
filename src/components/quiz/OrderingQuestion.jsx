import { useEffect, useMemo } from 'react'
import { shuffle } from '../../utils/scoring.js'

// Up/down buttons (avoids drag-drop dep). value = array of option_keys in user's order.
export default function OrderingQuestion({ options, value, onChange, disabled, feedback }) {
  // Initialise user's order: if value missing, start with a shuffled copy
  const initial = useMemo(() => shuffle(options.map((o) => o.option_key)), [options])
  useEffect(() => {
    if (!value || value.length !== options.length) onChange(initial)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const order = value && value.length === options.length ? value : initial
  const optionByKey = Object.fromEntries(options.map((o) => [o.option_key, o]))

  function move(idx, delta) {
    if (disabled) return
    const next = [...order]
    const target = idx + delta
    if (target < 0 || target >= next.length) return
    ;[next[idx], next[target]] = [next[target], next[idx]]
    onChange(next)
  }

  return (
    <ol className="space-y-2">
      {order.map((key, idx) => {
        const o = optionByKey[key]
        const userPos = idx + 1
        const correctPos = o ? parseInt(o.answer_value, 10) : null
        const inCorrectPos = feedback && correctPos === userPos

        let cls = 'border-gray-200 bg-white'
        let label = null
        if (feedback) {
          if (inCorrectPos) {
            cls = 'border-green-500 bg-green-50'
            label = { text: '✓ Correct', color: 'text-green-700' }
          } else if (correctPos) {
            cls = 'border-red-400 bg-red-50'
            label = { text: `→ pos ${correctPos}`, color: 'text-red-700' }
          }
        }

        return (
          <li
            key={key}
            className={`flex items-center gap-3 p-3 rounded-md border ${cls}`}
          >
            <span className="font-mono text-xs text-gray-500 w-6">{userPos}.</span>
            <span className="flex-1 text-sm">{o?.option_text ?? key}</span>
            {label && (
              <span className={`text-xs font-medium whitespace-nowrap ${label.color}`}>
                {label.text}
              </span>
            )}
            {!feedback && (
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  disabled={disabled || idx === 0}
                  onClick={() => move(idx, -1)}
                  className="text-xs px-2 py-0.5 rounded border border-gray-200 disabled:opacity-30 hover:bg-gray-50"
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={disabled || idx === order.length - 1}
                  onClick={() => move(idx, 1)}
                  className="text-xs px-2 py-0.5 rounded border border-gray-200 disabled:opacity-30 hover:bg-gray-50"
                >
                  ↓
                </button>
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}
