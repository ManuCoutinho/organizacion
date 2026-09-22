import { useCallback, useState } from 'react'

export type ToastTone = 'success' | 'error' | 'info'

export interface Toast {
  id: number
  tone: ToastTone
  message: string
}

export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const notify = useCallback(
    (tone: ToastTone, message: string) => {
      const id = Date.now() + Math.random()
      setToasts((current) => [...current, { id, tone, message }])
      window.setTimeout(() => dismiss(id), 4500)
    },
    [dismiss]
  )

  return { toasts, notify, dismiss }
}
