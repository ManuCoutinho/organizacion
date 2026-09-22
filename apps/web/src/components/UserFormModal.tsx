import { useEffect, useState, type FormEvent } from 'react'
import { ROLES, ROLE_LABELS, type Role, type User } from '@organizacion/shared'
import { ApiError } from '@/lib/api'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Modal } from './ui/Modal'
import { Select } from './ui/Select'

export interface UserFormValues {
  name: string
  email: string
  password: string
  role: Role
  active: boolean
}

interface UserFormModalProps {
  open: boolean
  user: User | null
  canEditRole: boolean
  onClose: () => void
  onSubmit: (values: UserFormValues) => Promise<void>
}

const EMPTY: UserFormValues = {
  name: '',
  email: '',
  password: '',
  role: 'CLIENT',
  active: true
}

export const UserFormModal = ({
  open,
  user,
  canEditRole,
  onClose,
  onSubmit
}: UserFormModalProps) => {
  const [values, setValues] = useState<UserFormValues>(EMPTY)
  const [error, setError] = useState<ApiError | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setError(null)
    setValues(
      user
        ? {
            name: user.name,
            email: user.email,
            password: '',
            role: user.role,
            active: user.active
          }
        : EMPTY
    )
  }, [open, user])

  const update = <K extends keyof UserFormValues>(
    field: K,
    value: UserFormValues[K]
  ) => setValues((current) => ({ ...current, [field]: value }))

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await onSubmit(values)
      onClose()
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
    <Modal
      open={open}
      onClose={onClose}
      title={user ? 'Editar usuario' : 'Cadastrar usuario'}
      description={
        user
          ? 'Atualize os dados cadastrais e o nivel de acesso.'
          : 'Preencha os dados do novo usuario do sistema.'
      }
      footer={
        <>
          <Button variant='ghost' type='button' onClick={onClose}>
            Cancelar
          </Button>
          <Button type='submit' form='user-form' loading={loading}>
            {user ? 'Salvar alteracoes' : 'Cadastrar'}
          </Button>
        </>
      }
    >
      <form
        id='user-form'
        className='space-y-4'
        onSubmit={handleSubmit}
        noValidate
      >
        <Input
          label='Nome'
          name='name'
          value={values.name}
          onChange={(event) => update('name', event.target.value)}
          error={error?.issueFor('name')}
          required
        />
        <Input
          label='E-mail'
          type='email'
          name='email'
          value={values.email}
          onChange={(event) => update('email', event.target.value)}
          error={error?.issueFor('email')}
          required
        />

        {!user ? (
          <Input
            label='Senha'
            type='password'
            name='password'
            autoComplete='new-password'
            value={values.password}
            onChange={(event) => update('password', event.target.value)}
            error={error?.issueFor('password')}
            hint='Minimo de 8 caracteres, com maiuscula, minuscula e numero.'
            required
          />
        ) : null}

        {canEditRole ? (
          <>
            <Select
              label='Perfil de acesso'
              name='role'
              value={values.role}
              onChange={(event) => update('role', event.target.value as Role)}
              error={error?.issueFor('role')}
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </Select>

            {user ? (
              <label className='flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3'>
                <input
                  type='checkbox'
                  name='active'
                  checked={values.active}
                  onChange={(event) => update('active', event.target.checked)}
                  className='size-4 accent-brand-500'
                />
                <span className='text-sm text-ink-200'>
                  Usuario ativo (pode autenticar na API)
                </span>
              </label>
            ) : null}
          </>
        ) : null}

        {error && error.issues.length === 0 ? (
          <p
            role='alert'
            className='rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200'
          >
            {error.message}
          </p>
        ) : null}
      </form>
    </Modal>
  )
}
