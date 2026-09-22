import { useId, type SelectHTMLAttributes } from 'react'
import { classNames } from '@/lib/format'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  hint?: string
}

export const Select = ({
  label,
  error,
  hint,
  className,
  id,
  children,
  ...rest
}: SelectProps) => {
  const generatedId = useId()
  const selectId = id ?? generatedId

  return (
    <div className='w-full'>
      <label className='field-label' htmlFor={selectId}>
        {label}
      </label>
      <select
        id={selectId}
        aria-invalid={!!error}
        className={classNames(
          'h-11 w-full appearance-none rounded-xl border bg-ink-950/60 px-3.5 text-sm text-ink-50 transition-colors',
          'focus:outline-none focus:ring-2',
          error
            ? 'border-rose-500/50 focus:border-rose-400 focus:ring-rose-500/30'
            : 'border-white/10 focus:border-brand-400 focus:ring-brand-500/25',
          className
        )}
        {...rest}
      >
        {children}
      </select>
      {error ? (
        <p className='mt-1.5 text-xs text-rose-300'>{error}</p>
      ) : hint ? (
        <p className='mt-1.5 text-xs text-ink-400'>{hint}</p>
      ) : null}
    </div>
  )
}
