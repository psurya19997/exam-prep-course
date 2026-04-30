export default function Modal({ open, title, children, actions, onClose }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {title && (
          <h2 className="text-lg font-semibold text-gray-900 mb-3">{title}</h2>
        )}
        <div className="text-sm text-gray-700">{children}</div>
        {actions && (
          <div className="mt-6 flex justify-end gap-2">{actions}</div>
        )}
        {!actions && onClose && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="text-sm px-4 py-2 rounded-md border border-gray-200 hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
