export default function McQuestion({ options, value, onChange, disabled }) {
  return (
    <ul className="space-y-2">
      {options.map((o) => {
        const selected = value === o.option_key
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
                type="radio"
                name="mc"
                disabled={disabled}
                checked={selected}
                onChange={() => onChange(o.option_key)}
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
