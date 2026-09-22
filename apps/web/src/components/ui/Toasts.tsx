import type { Toast, ToastTone } from '@/hooks/useToast'
import { classNames } from '@/lib/format'

const TONES: Record<ToastTone, string> = {
  success: 'border-emerald-400/30 bg-emerald-500/15 text-emerald-100',
  error: 'border-rose-400/30 bg-rose-500/15 text-rose-100',
  info: 'border-brand-400/30 bg-brand-500/15 text-brand-100'
}

interface ToastsProps {
  toasts: Toast[]
  onDismiss: (id: number) => void
}

export const Toasts = ({ toasts, onDismiss }: ToastsProps) => (
  <div
    role='status'
    aria-live='polite'
    className='pointer-events-none fixed bottom-6 right-6 z-[60] flex w-full max-w-sm flex-col gap-2'
  >
    {toasts.map((toast) => (
      <button
        key={toast.id}
        type='button'
        onClick={() => onDismiss(toast.id)}
        className={classNames(
          'animate-fade-up pointer-events-auto rounded-xl border px-4 py-3 text-left text-sm font-medium shadow-xl shadow-black/40 backdrop-blur-xl',
          TONES[toast.tone]
        )}
      >
        {toast.message}
      </button>
    ))}
  </div>
)
