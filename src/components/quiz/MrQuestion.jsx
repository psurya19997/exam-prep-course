export default function MrQuestion({ options, value = [], onChange, disabled }) {
  function toggle(key) {
    if (disabled) return
    if (value.includes(key)) onChange(value.filter((k) => k !== key))
    else onChange([...value, key])
  }
  return (
    <ul className="space-y-2">
      {options.map((o) => {
        const selected = value.includes(o.option_key)
        return (
          <li key={o.id}>
            <label
              className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition ${
                selected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              } ${disabled ? 'cursor-not-allowed opacity-90' : ''}`}
            >
              <input
                type="checkbox"
                disabled={disabled}
                checked={selected}
                onChange={() => toggle(o.option_key)}
                className="mt-1"
              />
              <span className="text-sm">
                <span className="font-mono text-xs text-gray-500 mr-2">
                  {o.option_key}
                </span>
                {o.option_text}
              </span>
            </label>
          </li>
        )
      })}
    </ul>
  )
}
