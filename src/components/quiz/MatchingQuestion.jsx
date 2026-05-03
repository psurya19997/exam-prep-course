// value = { L1: 'R2', ... }. Each left maps to one right via a <select>.
export default function MatchingQuestion({ options, value = {}, onChange, disabled, feedback }) {
  const lefts = options.filter((o) => o.option_key.startsWith('L'))
  const rights = options.filter((o) => o.option_key.startsWith('R'))
  const rightByKey = Object.fromEntries(rights.map((r) => [r.option_key, r]))

  function setPair(leftKey, rightKey) {
    if (disabled) return
    onChange({ ...value, [leftKey]: rightKey })
  }

  return (
    <ul className="space-y-2">
      {lefts.map((l) => {
        const userPick = value[l.option_key]
        const correctKey = l.answer_value
        const isCorrect = feedback && userPick === correctKey

        let cls = 'border-gray-200 bg-white'
        if (feedback) {
          cls = isCorrect ? 'border-green-500 bg-green-50' : 'border-red-400 bg-red-50'
        }

        const correctRight = rightByKey[correctKey]

        return (
          <li
            key={l.id}
            className={`flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-md border ${cls}`}
          >
            <div className="flex-1 text-sm">
              <span className="font-mono text-xs text-gray-500 mr-2">
                {l.option_key}
              </span>
              {l.option_text}
            </div>
            <span className="text-gray-400 hidden sm:inline">→</span>
            {feedback ? (
              <div className="flex flex-col items-start sm:items-end gap-0.5 text-sm">
                <span className={isCorrect ? 'text-green-700' : 'text-red-700'}>
                  {isCorrect ? '✓ ' : '✗ '}
                  {userPick
                    ? `${userPick}: ${rightByKey[userPick]?.option_text ?? ''}`
                    : '(no pick)'}
                </span>
                {!isCorrect && correctRight && (
                  <span className="text-xs text-green-700 font-medium">
                    → {correctKey}: {correctRight.option_text}
                  </span>
                )}
              </div>
            ) : (
              <select
                disabled={disabled}
                value={userPick ?? ''}
                onChange={(e) => setPair(l.option_key, e.target.value)}
                className="border border-gray-300 rounded-md px-2 py-1 text-sm bg-white"
              >
                <option value="">— pick a match —</option>
                {rights.map((r) => (
                  <option key={r.id} value={r.option_key}>
                    {r.option_key}: {r.option_text}
                  </option>
                ))}
              </select>
            )}
          </li>
        )
      })}
    </ul>
  )
}
