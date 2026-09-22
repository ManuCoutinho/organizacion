import { useState, type FormEvent } from 'react'
import { ROLE_DESCRIPTIONS, ROLE_LABELS, type User } from '@organizacion/shared'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { api, ApiError } from '@/lib/api'
import { formatDateTime, initialsOf } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { RoleBadge, StatusBadge } from '@/components/ui/RoleBadge'
import { Toasts } from '@/components/ui/Toasts'
import { Spinner } from '@/components/ui/Spinner'

export const Profile = () => {
  const { user, refreshUser } = useAuth()
  const { toasts, notify, dismiss } = useToast()

  const [profile, setProfile] = useState({
    name: user?.name ?? '',
    email: user?.email ?? ''
  })
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: ''
  })
  const [profileError, setProfileError] = useState<ApiError | null>(null)
  const [passwordError, setPasswordError] = useState<ApiError | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  if (!user) return <Spinner label='Carregando perfil' />

  const handleProfile = async (event: FormEvent) => {
    event.preventDefault()
    setSavingProfile(true)
    setProfileError(null)
    try {
      await api.put<User>(`/users/${user.id}`, profile)
      await refreshUser()
      notify('success', 'Dados atualizados com sucesso.')
    } catch (error) {
      if (error instanceof ApiError) {
        setProfileError(error)
        if (error.issues.length === 0) notify('error', error.message)
      } else {
        notify('error', 'Falha de comunicacao com a API.')
      }
    } finally {
      setSavingProfile(false)
    }
  }

  const handlePassword = async (event: FormEvent) => {
    event.preventDefault()
    setSavingPassword(true)
    setPasswordError(null)
    try {
      await api.patch(`/users/${user.id}/password`, passwords)
      setPasswords({ currentPassword: '', newPassword: '' })
      notify('success', 'Senha alterada. As outras sessoes foram encerradas.')
    } catch (error) {
      if (error instanceof ApiError) {
        setPasswordError(error)
        if (error.issues.length === 0) notify('error', error.message)
      } else {
        notify('error', 'Falha de comunicacao com a API.')
      }
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div className='space-y-6'>
      <section className='surface flex flex-wrap items-center gap-5 p-6'>
        <span className='flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 text-xl font-black text-white'>
          {initialsOf(user.name)}
        </span>
        <div className='min-w-0 flex-1'>
          <h1 className='text-2xl font-bold text-ink-50'>{user.name}</h1>
          <p className='text-sm text-ink-400'>{user.email}</p>
          <div className='mt-3 flex flex-wrap items-center gap-2'>
            <RoleBadge role={user.role} />
            <StatusBadge active={user.active} />
            <span className='text-xs text-ink-500'>
              Cadastrado em {formatDateTime(user.createdAt)}
            </span>
          </div>
        </div>
      </section>

      <section className='surface p-6'>
        <h2 className='text-sm font-semibold text-ink-100'>
          Permissoes do perfil {ROLE_LABELS[user.role]}
        </h2>
        <p className='mt-1 text-sm text-ink-400'>
          {ROLE_DESCRIPTIONS[user.role]}
        </p>
      </section>

      <div className='grid gap-6 lg:grid-cols-2'>
        <section className='surface p-6'>
          <h2 className='text-lg font-semibold text-ink-50'>
            Dados cadastrais
          </h2>
          <p className='mt-1 text-sm text-ink-400'>
            Alteracoes de perfil de acesso sao exclusivas do Administrador.
          </p>
          <form className='mt-5 space-y-4' onSubmit={handleProfile} noValidate>
            <Input
              label='Nome'
              value={profile.name}
              onChange={(event) =>
                setProfile((current) => ({
                  ...current,
                  name: event.target.value
                }))
              }
              error={profileError?.issueFor('name')}
              required
            />
            <Input
              label='E-mail'
              type='email'
              value={profile.email}
              onChange={(event) =>
                setProfile((current) => ({
                  ...current,
                  email: event.target.value
                }))
              }
              error={profileError?.issueFor('email')}
              required
            />
            <Button type='submit' loading={savingProfile}>
              Salvar alteracoes
            </Button>
          </form>
        </section>

        <section className='surface p-6'>
          <h2 className='text-lg font-semibold text-ink-50'>Alterar senha</h2>
          <p className='mt-1 text-sm text-ink-400'>
            Ao trocar a senha todos os refresh tokens ativos sao revogados.
          </p>
          <form className='mt-5 space-y-4' onSubmit={handlePassword} noValidate>
            <Input
              label='Senha atual'
              type='password'
              autoComplete='current-password'
              value={passwords.currentPassword}
              onChange={(event) =>
                setPasswords((current) => ({
                  ...current,
                  currentPassword: event.target.value
                }))
              }
              error={passwordError?.issueFor('currentPassword')}
              required
            />
            <Input
              label='Nova senha'
              type='password'
              autoComplete='new-password'
              value={passwords.newPassword}
              onChange={(event) =>
                setPasswords((current) => ({
                  ...current,
                  newPassword: event.target.value
                }))
              }
              error={passwordError?.issueFor('newPassword')}
              hint='Minimo de 8 caracteres, com maiuscula, minuscula e numero.'
              required
            />
            <Button type='submit' loading={savingPassword}>
              Atualizar senha
            </Button>
          </form>
        </section>
      </div>

      <Toasts toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}
