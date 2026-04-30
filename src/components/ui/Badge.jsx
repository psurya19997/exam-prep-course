const styles = {
  gray: 'bg-gray-100 text-gray-700',
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-green-100 text-green-700',
  yellow: 'bg-yellow-100 text-yellow-800',
  red: 'bg-red-100 text-red-700',
}

export default function Badge({ tone = 'gray', children }) {
  return (
    <span
      className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${
        styles[tone] ?? styles.gray
      }`}
    >
      {children}
    </span>
  )
}
