export default function MrQuestion({ options, value = [], onChange, disabled, feedback }) {
  function toggle(key) {
    if (disabled) return
    if (value.includes(key)) onChange(value.filter((k) => k !== key))
    else onChange([...value, key])
  }
  return (
    <ul className="space-y-2">
      {options.map((o) => {
        const selected = value.includes(o.option_key)
        const isCorrect = o.answer_value === 'true'

        let cls
        let label = null
        if (feedback) {
          if (isCorrect && selected) {
            cls = 'border-green-500 bg-green-50'
            label = { text: '✓ Correct', color: 'text-green-700' }
          } else if (isCorrect && !selected) {
            cls = 'border-green-500 bg-green-50'
            label = { text: '✓ Should select', color: 'text-green-700' }
          } else if (!isCorrect && selected) {
            cls = 'border-red-400 bg-red-50'
            label = { text: '✗ Wrong', color: 'text-red-700' }
          } else {
            cls = 'border-gray-200 bg-white'
          }
        } else {
          cls = selected
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-200 bg-white hover:border-gray-300'
        }

        const interactive = !disabled && !feedback
        return (
          <li key={o.id}>
            <label
              className={`flex items-start gap-3 p-3 rounded-md border transition ${cls} ${
                interactive ? 'cursor-pointer' : 'cursor-not-allowed opacity-90'
              }`}
            >
              <input
                type="checkbox"
                disabled={disabled}
                checked={selected}
                onChange={() => toggle(o.option_key)}
                className="mt-1"
              />
              <span className="text-sm flex-1">
                <span className="font-mono text-xs text-gray-500 mr-2">
                  {o.option_key}
                </span>
                {o.option_text}
              </span>
              {label && (
                <span className={`text-xs font-medium whitespace-nowrap ${label.color}`}>
                  {label.text}
                </span>
              )}
            </label>
          </li>
        )
      })}
    </ul>
  )
}
