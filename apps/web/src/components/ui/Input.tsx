import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { classNames } from '@/lib/format'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
  icon?: ReactNode
}

export const Input = ({
  label,
  error,
  hint,
  icon,
  className,
  id,
  ...rest
}: InputProps) => {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <div className='w-full'>
      <label className='field-label' htmlFor={inputId}>
        {label}
      </label>
      <div className='relative'>
        {icon ? (
          <span className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400'>
            {icon}
          </span>
        ) : null}
        <input
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={classNames(
            'h-11 w-full rounded-xl border bg-ink-950/60 px-3.5 text-sm text-ink-50 transition-colors',
            'placeholder:text-ink-500 focus:outline-none focus:ring-2',
            icon ? 'pl-10' : null,
            error
              ? 'border-rose-500/50 focus:border-rose-400 focus:ring-rose-500/30'
              : 'border-white/10 focus:border-brand-400 focus:ring-brand-500/25',
            className
          )}
          {...rest}
        />
      </div>
      {error ? (
        <p id={`${inputId}-error`} className='mt-1.5 text-xs text-rose-300'>
          {error}
        </p>
      ) : hint ? (
        <p className='mt-1.5 text-xs text-ink-400'>{hint}</p>
      ) : null}
    </div>
  )
}
