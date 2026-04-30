import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

const ToastContext = createContext({
  toasts: [],
  toast: () => {},
  dismiss: () => {},
})

let nextId = 1

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const handle = timers.current[id]
    if (handle) {
      clearTimeout(handle)
      delete timers.current[id]
    }
  }, [])

  const toast = useCallback(
    (input) => {
      const id = nextId++
      const t =
        typeof input === 'string'
          ? { id, tone: 'success', message: input }
          : { id, tone: 'success', ...input }
      setToasts((prev) => [...prev, t])
      const ttl = t.duration ?? 4000
      timers.current[id] = setTimeout(() => dismiss(id), ttl)
      return id
    },
    [dismiss]
  )

  useEffect(() => {
    const handlesRef = timers.current
    return () => {
      Object.values(handlesRef).forEach(clearTimeout)
    }
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <ToastViewport toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}

const toneStyles = {
  success: 'bg-green-50 border-green-200 text-green-900',
  info:    'bg-blue-50 border-blue-200 text-blue-900',
  error:   'bg-red-50 border-red-200 text-red-900',
}

function ToastViewport({ toasts, dismiss }) {
  return (
    <div
      aria-live="polite"
      className="fixed top-4 right-4 left-4 sm:left-auto z-50 flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto border rounded-md shadow-md px-4 py-3 text-sm sm:max-w-sm ml-auto ${
            toneStyles[t.tone] ?? toneStyles.success
          }`}
        >
          <div className="flex items-start gap-3">
            <p className="flex-1">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="text-xs opacity-60 hover:opacity-100"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
