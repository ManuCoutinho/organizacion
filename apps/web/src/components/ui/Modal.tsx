import { useEffect, type ReactNode } from 'react'

interface ModalProps {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

export const Modal = ({
  open,
  title,
  description,
  onClose,
  children,
  footer
}: ModalProps) => {
  useEffect(() => {
    if (!open) return
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className='fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center'>
      <button
        type='button'
        aria-label='Fechar modal'
        onClick={onClose}
        className='absolute inset-0 bg-ink-950/80 backdrop-blur-sm'
      />
      <div
        role='dialog'
        aria-modal='true'
        aria-label={title}
        className='surface animate-fade-up relative z-10 w-full max-w-lg overflow-hidden'
      >
        <header className='border-b border-white/5 px-6 py-5'>
          <h2 className='text-lg font-semibold text-ink-50'>{title}</h2>
          {description ? (
            <p className='mt-1 text-sm text-ink-400'>{description}</p>
          ) : null}
        </header>
        <div className='max-h-[60vh] overflow-y-auto px-6 py-5'>{children}</div>
        {footer ? (
          <footer className='flex justify-end gap-3 border-t border-white/5 bg-ink-950/40 px-6 py-4'>
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  )
}
