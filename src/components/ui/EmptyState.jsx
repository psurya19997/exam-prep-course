export default function EmptyState({ title, description, action }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
      {title && (
        <p className="text-gray-900 font-medium">{title}</p>
      )}
      {description && (
        <p className="text-gray-600 text-sm mt-1">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
