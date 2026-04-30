// Spinner sizes are written as literal class names so Tailwind's JIT scanner
// picks them up at build time.
const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-8 w-8',
}

export default function Spinner({ size = 'md', className = '' }) {
  return (
    <svg
      className={`animate-spin ${sizeMap[size] ?? sizeMap.md} text-blue-600 ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        className="opacity-20"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  )
}

export function LoadingState({ label = 'Loading…' }) {
  return (
    <div className="flex items-center gap-3 text-gray-500 py-12 justify-center">
      <Spinner />
      <span className="text-sm">{label}</span>
    </div>
  )
}
