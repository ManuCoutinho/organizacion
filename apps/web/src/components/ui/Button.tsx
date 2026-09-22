import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { classNames } from '@/lib/format'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-brand-600 text-white shadow-lg shadow-brand-600/25 hover:bg-brand-500 focus-visible:outline-brand-400',
  secondary:
    'border border-white/10 bg-white/5 text-ink-100 hover:border-white/20 hover:bg-white/10 focus-visible:outline-ink-300',
  ghost:
    'text-ink-300 hover:bg-white/5 hover:text-ink-50 focus-visible:outline-ink-400',
  danger:
    'border border-rose-500/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20 focus-visible:outline-rose-400'
}

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-5 text-sm'
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: ReactNode
}

export const Button = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) => (
  <button
    className={classNames(
      'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200',
      'focus-visible:outline-2 focus-visible:outline-offset-2',
      'disabled:cursor-not-allowed disabled:opacity-50',
      VARIANTS[variant],
      SIZES[size],
      className
    )}
    disabled={disabled || loading}
    {...rest}
  >
    {loading ? (
      <span
        aria-hidden='true'
        className='size-4 animate-spin rounded-full border-2 border-current border-t-transparent'
      />
    ) : (
      icon
    )}
    {children}
  </button>
)
