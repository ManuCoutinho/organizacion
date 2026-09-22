import { ROLE_LABELS, type Role } from '@organizacion/shared'
import { classNames } from '@/lib/format'

const TONES: Record<Role, string> = {
  ADMIN: 'border-accent-400/30 bg-accent-500/15 text-accent-400',
  OPERATOR: 'border-brand-400/30 bg-brand-500/15 text-brand-300',
  CLIENT: 'border-emerald-400/30 bg-emerald-500/15 text-emerald-300'
}

export const RoleBadge = ({ role }: { role: Role }) => (
  <span
    className={classNames(
      'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold',
      TONES[role]
    )}
  >
    {ROLE_LABELS[role]}
  </span>
)

export const StatusBadge = ({ active }: { active: boolean }) => (
  <span
    className={classNames(
      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold',
      active
        ? 'border-emerald-400/25 bg-emerald-500/10 text-emerald-300'
        : 'border-ink-500/40 bg-ink-700/40 text-ink-300'
    )}
  >
    <span
      className={classNames(
        'size-1.5 rounded-full',
        active ? 'bg-emerald-400' : 'bg-ink-400'
      )}
    />
    {active ? 'Ativo' : 'Inativo'}
  </span>
)
