import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  description: string
  action?: ReactNode
}

export const EmptyState = ({ title, description, action }: EmptyStateProps) => (
  <div className='flex flex-col items-center justify-center gap-3 px-6 py-16 text-center'>
    <div className='flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-xl'>
      &#9679;
    </div>
    <h3 className='text-base font-semibold text-ink-100'>{title}</h3>
    <p className='max-w-sm text-sm text-ink-400'>{description}</p>
    {action}
  </div>
)
