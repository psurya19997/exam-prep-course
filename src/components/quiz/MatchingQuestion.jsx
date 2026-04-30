// value = { L1: 'R2', ... }. Each left maps to one right via a <select>.
export default function MatchingQuestion({ options, value = {}, onChange, disabled }) {
  const lefts = options.filter((o) => o.option_key.startsWith('L'))
  const rights = options.filter((o) => o.option_key.startsWith('R'))

  function setPair(leftKey, rightKey) {
    if (disabled) return
    onChange({ ...value, [leftKey]: rightKey })
  }

  return (
    <ul className="space-y-2">
      {lefts.map((l) => (
        <li
          key={l.id}
          className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-md border border-gray-200 bg-white"
        >
          <div className="flex-1 text-sm">
            <span className="font-mono text-xs text-gray-500 mr-2">
              {l.option_key}
            </span>
            {l.option_text}
          </div>
          <span className="text-gray-400 hidden sm:inline">→</span>
          <select
            disabled={disabled}
            value={value[l.option_key] ?? ''}
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
        </li>
      ))}
    </ul>
  )
}
