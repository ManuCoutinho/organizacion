import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { ApiError } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export const Register = () => {
  const { signUp, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState<ApiError | null>(null)
  const [loading, setLoading] = useState(false)

  if (isAuthenticated) return <Navigate to='/perfil' replace />

  const update = (field: keyof typeof form) => (value: string) =>
    setForm((current) => ({ ...current, [field]: value }))

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await signUp(form.name, form.email, form.password)
      navigate('/perfil', { replace: true })
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

  return (
    <div className='flex min-h-screen items-center justify-center px-4 py-12'>
      <section className='surface animate-fade-up w-full max-w-md p-8'>
        <h1 className='text-2xl font-bold text-ink-50'>Criar conta</h1>
        <p className='mt-1 text-sm text-ink-400'>
          O auto cadastro sempre gera um usuario com o perfil Cliente.
        </p>

        <form className='mt-6 space-y-4' onSubmit={handleSubmit} noValidate>
          <Input
            label='Nome completo'
            name='name'
            autoComplete='name'
            placeholder='Maria Silva'
            value={form.name}
            onChange={(event) => update('name')(event.target.value)}
            error={error?.issueFor('name')}
            required
          />
          <Input
            label='E-mail'
            type='email'
            name='email'
            autoComplete='email'
            placeholder='voce@empresa.com'
            value={form.email}
            onChange={(event) => update('email')(event.target.value)}
            error={error?.issueFor('email')}
            required
          />
          <Input
            label='Senha'
            type='password'
            name='password'
            autoComplete='new-password'
            placeholder='********'
            value={form.password}
            onChange={(event) => update('password')(event.target.value)}
            error={error?.issueFor('password')}
            hint='Minimo de 8 caracteres, com maiuscula, minuscula e numero.'
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
            Criar conta
          </Button>
        </form>

        <p className='mt-6 text-center text-sm text-ink-400'>
          Ja possui cadastro?{' '}
          <Link
            to='/login'
            className='font-semibold text-brand-300 hover:text-brand-200'
          >
            Entrar
          </Link>
        </p>
      </section>
    </div>
  )
}
