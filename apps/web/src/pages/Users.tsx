import { useCallback, useEffect, useState } from 'react'
import {
  ROLES,
  ROLE_LABELS,
  type PaginatedUsers,
  type Role,
  type User
} from '@organizacion/shared'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { api, ApiError } from '@/lib/api'
import { formatDateTime, initialsOf } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { RoleBadge, StatusBadge } from '@/components/ui/RoleBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { Toasts } from '@/components/ui/Toasts'
import { UserFormModal, type UserFormValues } from '@/components/UserFormModal'
import { ConfirmDialog } from '@/components/ConfirmDialog'

const PER_PAGE = 8

export const Users = () => {
  const { user: currentUser, can, refreshUser } = useAuth()
  const { toasts, notify, dismiss } = useToast()

  const [result, setResult] = useState<PaginatedUsers | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<Role | ''>('')
  const [page, setPage] = useState(1)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [removing, setRemoving] = useState<User | null>(null)

  const isAdmin = can('ADMIN')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        perPage: String(PER_PAGE)
      })
      if (search.trim()) params.set('search', search.trim())
      if (roleFilter) params.set('role', roleFilter)

      setResult(await api.get<PaginatedUsers>(`/users?${params.toString()}`))
    } catch (error) {
      notify(
        'error',
        error instanceof ApiError
          ? error.message
          : 'Falha ao carregar usuarios.'
      )
    } finally {
      setLoading(false)
    }
  }, [page, search, roleFilter, notify])

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 250)
    return () => window.clearTimeout(timer)
  }, [load])

  const handleSubmit = async (values: UserFormValues) => {
    if (editing) {
      const payload: Record<string, unknown> = {
        name: values.name,
        email: values.email
      }
      if (isAdmin) {
        payload.role = values.role
        payload.active = values.active
      }
      await api.put<User>(`/users/${editing.id}`, payload)
      notify('success', 'Usuario atualizado com sucesso.')
      if (editing.id === currentUser?.id) await refreshUser()
    } else {
      await api.post<User>('/users', {
        name: values.name,
        email: values.email,
        password: values.password,
        role: values.role
      })
      notify('success', 'Usuario cadastrado com sucesso.')
    }
    await load()
  }

  const handleRemove = async () => {
    if (!removing) return
    try {
      await api.delete(`/users/${removing.id}`)
      notify('success', `${removing.name} foi excluido.`)
      setRemoving(null)
      await load()
    } catch (error) {
      notify(
        'error',
        error instanceof ApiError ? error.message : 'Falha ao excluir usuario.'
      )
      setRemoving(null)
    }
  }

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (user: User) => {
    setEditing(user)
    setFormOpen(true)
  }

  const totalPages = result?.meta.totalPages ?? 1

  return (
    <div className='space-y-6'>
      <div className='flex flex-wrap items-end justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold text-ink-50'>Usuarios</h1>
          <p className='mt-1 text-sm text-ink-400'>
            {result
              ? `${result.meta.total} usuario(s) cadastrado(s) no sistema.`
              : 'Consultando a API...'}
          </p>
        </div>
        {isAdmin ? (
          <Button onClick={openCreate}>Novo usuario</Button>
        ) : (
          <span className='rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-ink-400'>
            Seu perfil permite consultar e atualizar dados cadastrais.
          </span>
        )}
      </div>

      <div className='surface grid gap-4 p-4 sm:grid-cols-[2fr_1fr]'>
        <Input
          label='Buscar'
          placeholder='Nome ou e-mail'
          value={search}
          onChange={(event) => {
            setPage(1)
            setSearch(event.target.value)
          }}
        />
        <Select
          label='Perfil de acesso'
          value={roleFilter}
          onChange={(event) => {
            setPage(1)
            setRoleFilter(event.target.value as Role | '')
          }}
        >
          <option value=''>Todos os perfis</option>
          {ROLES.map((role) => (
            <option key={role} value={role}>
              {ROLE_LABELS[role]}
            </option>
          ))}
        </Select>
      </div>

      <div className='surface overflow-hidden'>
        {loading ? (
          <Spinner label='Consultando usuarios' />
        ) : !result || result.data.length === 0 ? (
          <EmptyState
            title='Nenhum usuario encontrado'
            description='Ajuste os filtros de busca ou cadastre um novo usuario.'
            action={
              isAdmin ? (
                <Button onClick={openCreate}>Novo usuario</Button>
              ) : undefined
            }
          />
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full min-w-[46rem] text-left text-sm'>
              <thead>
                <tr className='border-b border-white/5 text-xs uppercase tracking-wider text-ink-400'>
                  <th scope='col' className='px-5 py-3 font-semibold'>
                    Usuario
                  </th>
                  <th scope='col' className='px-5 py-3 font-semibold'>
                    Perfil
                  </th>
                  <th scope='col' className='px-5 py-3 font-semibold'>
                    Status
                  </th>
                  <th scope='col' className='px-5 py-3 font-semibold'>
                    Criado em
                  </th>
                  <th
                    scope='col'
                    className='px-5 py-3 text-right font-semibold'
                  >
                    Acoes
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-white/5'>
                {result.data.map((user) => (
                  <tr
                    key={user.id}
                    className='transition-colors hover:bg-white/[0.03]'
                  >
                    <td className='px-5 py-4'>
                      <div className='flex items-center gap-3'>
                        <span className='flex size-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs font-bold text-ink-100'>
                          {initialsOf(user.name)}
                        </span>
                        <div className='min-w-0'>
                          <p className='truncate font-semibold text-ink-100'>
                            {user.name}
                            {user.id === currentUser?.id ? (
                              <span className='ml-2 text-[10px] font-bold uppercase text-brand-300'>
                                voce
                              </span>
                            ) : null}
                          </p>
                          <p className='truncate text-xs text-ink-400'>
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className='px-5 py-4'>
                      <RoleBadge role={user.role} />
                    </td>
                    <td className='px-5 py-4'>
                      <StatusBadge active={user.active} />
                    </td>
                    <td className='px-5 py-4 text-xs text-ink-400'>
                      {formatDateTime(user.createdAt)}
                    </td>
                    <td className='px-5 py-4'>
                      <div className='flex justify-end gap-2'>
                        <Button
                          size='sm'
                          variant='secondary'
                          onClick={() => openEdit(user)}
                        >
                          Editar
                        </Button>
                        {isAdmin && user.id !== currentUser?.id ? (
                          <Button
                            size='sm'
                            variant='danger'
                            onClick={() => setRemoving(user)}
                          >
                            Excluir
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {result && result.data.length > 0 ? (
          <div className='flex items-center justify-between border-t border-white/5 px-5 py-3 text-xs text-ink-400'>
            <span>
              Pagina {result.meta.page} de {totalPages}
            </span>
            <div className='flex gap-2'>
              <Button
                size='sm'
                variant='secondary'
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
              >
                Anterior
              </Button>
              <Button
                size='sm'
                variant='secondary'
                disabled={page >= totalPages}
                onClick={() => setPage((current) => current + 1)}
              >
                Proxima
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <UserFormModal
        open={formOpen}
        user={editing}
        canEditRole={isAdmin}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!removing}
        title='Excluir usuario'
        message={`Esta acao remove ${removing?.name ?? ''} permanentemente do sistema. Deseja continuar?`}
        confirmLabel='Excluir'
        onCancel={() => setRemoving(null)}
        onConfirm={handleRemove}
      />

      <Toasts toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}
