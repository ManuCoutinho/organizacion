import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { ROLE_LABELS } from '@organizacion/shared'
import { useAuth } from '@/hooks/useAuth'
import { classNames, initialsOf } from '@/lib/format'
import { Button } from '../ui/Button'
import { ApiConsole } from '../ApiConsole'

const NAV_LINK_CLASS =
  'rounded-xl px-4 py-2 text-sm font-medium transition-colors'

export const AppShell = () => {
  const { user, signOut, can } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className='min-h-screen'>
      <header className='sticky top-0 z-30 border-b border-white/5 bg-ink-950/70 backdrop-blur-xl'>
        <div className='mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3 sm:px-6'>
          <div className='flex items-center gap-3'>
            <span className='flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 text-sm font-black text-white'>
              O
            </span>
            <div className='leading-tight'>
              <p className='text-sm font-bold text-ink-50'>Organizacion</p>
              <p className='text-[11px] text-ink-400'>Gestao de usuarios</p>
            </div>
          </div>

          <nav className='flex items-center gap-1'>
            {can('ADMIN', 'OPERATOR') ? (
              <NavLink
                to='/usuarios'
                className={({ isActive }) =>
                  classNames(
                    NAV_LINK_CLASS,
                    isActive
                      ? 'bg-white/10 text-ink-50'
                      : 'text-ink-400 hover:bg-white/5 hover:text-ink-100'
                  )
                }
              >
                Usuarios
              </NavLink>
            ) : null}
            <NavLink
              to='/perfil'
              className={({ isActive }) =>
                classNames(
                  NAV_LINK_CLASS,
                  isActive
                    ? 'bg-white/10 text-ink-50'
                    : 'text-ink-400 hover:bg-white/5 hover:text-ink-100'
                )
              }
            >
              Meu perfil
            </NavLink>
          </nav>

          <div className='ml-auto flex items-center gap-3'>
            {user ? (
              <div className='flex items-center gap-3'>
                <div className='hidden text-right sm:block'>
                  <p className='text-sm font-semibold text-ink-100'>
                    {user.name}
                  </p>
                  <p className='text-[11px] text-ink-400'>
                    {ROLE_LABELS[user.role]}
                  </p>
                </div>
                <span className='flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs font-bold text-ink-100'>
                  {initialsOf(user.name)}
                </span>
              </div>
            ) : null}
            <Button size='sm' variant='secondary' onClick={handleSignOut}>
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className='mx-auto max-w-6xl px-4 py-8 sm:px-6'>
        <Outlet />
      </main>

      <ApiConsole />
    </div>
  )
}
