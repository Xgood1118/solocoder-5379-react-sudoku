import React, { useEffect } from 'react'

function Toast({ toasts, onClose }) {
  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast ${toast.type || 'info'}`}>
          <div className="toast-content">
            {toast.title && <div className="toast-title">{toast.title}</div>}
            <div className="toast-message">{toast.message}</div>
          </div>
          <button className="toast-close" onClick={() => onClose(toast.id)}>
            ×
          </button>
        </div>
      ))}
    </div>
  )
}

export function useToast() {
  const [toasts, setToasts] = React.useState([])

  const addToast = React.useCallback((toast) => {
    const id = Date.now()
    setToasts(prev => [...prev, { ...toast, id }])
    return id
  }, [])

  const removeToast = React.useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const showToast = React.useCallback((options, type = 'info', duration = 3000) => {
    let toastOptions
    if (typeof options === 'object' && options !== null) {
      toastOptions = options
    } else {
      toastOptions = { message: options, type, duration }
    }
    const id = addToast(toastOptions)
    const dur = toastOptions.duration !== undefined ? toastOptions.duration : 3000
    if (dur > 0) {
      setTimeout(() => removeToast(id), dur)
    }
    return id
  }, [addToast, removeToast])

  return { toasts, addToast, removeToast, showToast }
}

export default Toast
