import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { ApiError } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const DEMO_ACCOUNTS = [
  {
    label: 'Administrador',
    email: 'admin@organizacion.dev',
    password: 'Admin@12345'
  },
  {
    label: 'Operador',
    email: 'operador@organizacion.dev',
    password: 'Operador@123'
  },
  {
    label: 'Cliente',
    email: 'cliente@organizacion.dev',
    password: 'Cliente@123'
  }
]

export const Login = () => {
  const { signIn, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<ApiError | null>(null)
  const [loading, setLoading] = useState(false)

  if (isAuthenticated) return <Navigate to='/usuarios' replace />

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await signIn(email, password)
      navigate('/usuarios', { replace: true })
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught
          : new ApiError(0, null, 'Falha de comunicacao com a API.')
      )
    } finally {
      setLoading(false)
    }
  }

  const applyDemoAccount = (account: (typeof DEMO_ACCOUNTS)[number]) => {
    setEmail(account.email)
    setPassword(account.password)
    setError(null)
  }

  return (
    <div className='flex min-h-screen items-center justify-center px-4 py-12'>
      <div className='grid w-full max-w-5xl gap-8 lg:grid-cols-[1.1fr_1fr]'>
        <section className='hidden flex-col justify-center gap-6 lg:flex'>
          <span className='inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-brand-300'>
            API REST - JWT - RBAC
          </span>
          <h1 className='bg-gradient-to-r from-white via-brand-300 to-accent-400 bg-clip-text text-5xl font-black leading-tight text-transparent'>
            Gerencie usuarios com seguranca de ponta a ponta
          </h1>
          <p className='max-w-md text-base text-ink-300'>
            Autenticacao com JSON Web Token, controle de acesso por perfil e
            todas as respostas HTTP visiveis em tempo real na interface.
          </p>
          <dl className='grid grid-cols-3 gap-3'>
            {[
              { term: 'Perfis', detail: 'Admin, Operador e Cliente' },
              { term: 'Token', detail: 'JWT com validade de 1 hora' },
              { term: 'Senhas', detail: 'Hash bcrypt com 12 rounds' }
            ].map((item) => (
              <div
                key={item.term}
                className='rounded-2xl border border-white/10 bg-white/5 p-4'
              >
                <dt className='text-xs font-semibold uppercase tracking-wider text-brand-300'>
                  {item.term}
                </dt>
                <dd className='mt-1 text-sm text-ink-300'>{item.detail}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className='surface animate-fade-up p-8'>
          <h2 className='text-2xl font-bold text-ink-50'>Entrar</h2>
          <p className='mt-1 text-sm text-ink-400'>
            Informe suas credenciais para receber o token de acesso.
          </p>

          <form className='mt-6 space-y-4' onSubmit={handleSubmit} noValidate>
            <Input
              label='E-mail'
              type='email'
              name='email'
              autoComplete='email'
              placeholder='voce@empresa.com'
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={error?.issueFor('email')}
              required
            />
            <Input
              label='Senha'
              type='password'
              name='password'
              autoComplete='current-password'
              placeholder='********'
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              error={error?.issueFor('password')}
              required
            />

            {error && error.issues.length === 0 ? (
              <p
                role='alert'
                className='rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200'
              >
                {error.message}
              </p>
            ) : null}

            <Button type='submit' className='w-full' loading={loading}>
              Entrar
            </Button>
          </form>

          <div className='mt-6 border-t border-white/5 pt-5'>
            <p className='field-label'>Contas de demonstracao</p>
            <div className='flex flex-wrap gap-2'>
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  type='button'
                  onClick={() => applyDemoAccount(account)}
                  className='rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-ink-300 transition-colors hover:border-brand-400/40 hover:text-white'
                >
                  {account.label}
                </button>
              ))}
            </div>
          </div>

          <p className='mt-6 text-center text-sm text-ink-400'>
            Ainda nao tem conta?{' '}
            <Link
              to='/cadastro'
              className='font-semibold text-brand-300 hover:text-brand-200'
            >
              Cadastre-se
            </Link>
          </p>
        </section>
      </div>
    </div>
  )
}
