import { describe, expect, it, vi, beforeEach } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Role, User } from '@organizacion/shared'
import { Users } from '@/pages/Users'
import {
  errorResponse,
  jsonResponse,
  makeUser,
  renderWithProviders,
  seedSession
} from '../test/helpers'

const LIST = [
  makeUser({ id: 'id-admin', name: 'Ana Souza', role: 'ADMIN' }),
  makeUser({
    id: 'id-operator',
    name: 'Bruno Lima',
    email: 'bruno@organizacion.dev',
    role: 'OPERATOR'
  }),
  makeUser({
    id: 'id-client',
    name: 'Carla Dias',
    email: 'carla@organizacion.dev',
    role: 'CLIENT',
    active: false
  })
]

const listPayload = (data: User[] = LIST) => ({
  data,
  meta: { total: data.length, page: 1, perPage: 8, totalPages: 1 }
})

const mockApi = (
  currentRole: Role,
  handlers: Record<string, Response> = {}
) => {
  const me = makeUser({ id: 'id-admin', name: 'Ana Souza', role: currentRole })

  return vi
    .spyOn(globalThis, 'fetch')
    .mockImplementation(async (input, init) => {
      const url = String(input)
      const method = init?.method ?? 'GET'
      const key = `${method} ${url.split('?')[0]}`

      if (handlers[key]) return handlers[key]
      if (url.includes('/auth/me')) return jsonResponse(me)
      if (url.includes('/users')) return jsonResponse(listPayload())
      return jsonResponse({})
    })
}

describe('<Users />', () => {
  beforeEach(seedSession)

  it('lista os usuarios retornados pela API', async () => {
    mockApi('ADMIN')
    renderWithProviders(<Users />)

    expect(await screen.findByText('Ana Souza')).toBeInTheDocument()
    expect(screen.getByText('Bruno Lima')).toBeInTheDocument()
    expect(screen.getByText('Carla Dias')).toBeInTheDocument()
    expect(
      screen.getByText('3 usuario(s) cadastrado(s) no sistema.')
    ).toBeInTheDocument()
  })

  it('mostra perfil e status de cada usuario', async () => {
    mockApi('ADMIN')
    renderWithProviders(<Users />)

    await screen.findByText('Carla Dias')
    expect(screen.getAllByText('Administrador').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Operador').length).toBeGreaterThan(0)
    expect(screen.getByText('Inativo')).toBeInTheDocument()
  })

  it('oferece o botao de cadastro somente para o Administrador', async () => {
    mockApi('ADMIN')
    renderWithProviders(<Users />)

    expect(
      await screen.findByRole('button', { name: 'Novo usuario' })
    ).toBeInTheDocument()
  })

  it('oculta cadastro e exclusao para o perfil Operador', async () => {
    mockApi('OPERATOR')
    renderWithProviders(<Users />)

    await screen.findByText('Bruno Lima')
    expect(screen.queryByRole('button', { name: 'Novo usuario' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Excluir' })).toBeNull()
    expect(
      screen.getByText(
        'Seu perfil permite consultar e atualizar dados cadastrais.'
      )
    ).toBeInTheDocument()
  })

  it('cadastra um novo usuario pelo modal', async () => {
    const user = userEvent.setup()
    const fetchMock = mockApi('ADMIN')
    renderWithProviders(<Users />)

    await user.click(
      await screen.findByRole('button', { name: 'Novo usuario' })
    )

    const dialog = screen.getByRole('dialog')
    await user.type(within(dialog).getByLabelText('Nome'), 'Diego Nunes')
    await user.type(
      within(dialog).getByLabelText('E-mail'),
      'diego@organizacion.dev'
    )
    await user.type(within(dialog).getByLabelText('Senha'), 'Senha@123')
    await user.selectOptions(
      within(dialog).getByLabelText('Perfil de acesso'),
      'OPERATOR'
    )
    await user.click(within(dialog).getByRole('button', { name: 'Cadastrar' }))

    await waitFor(() => {
      const posted = fetchMock.mock.calls.find(
        ([url, init]) =>
          String(url).endsWith('/users') && init?.method === 'POST'
      )
      expect(posted).toBeDefined()
      expect(JSON.parse(String(posted?.[1]?.body))).toMatchObject({
        name: 'Diego Nunes',
        email: 'diego@organizacion.dev',
        role: 'OPERATOR'
      })
    })

    expect(
      await screen.findByText('Usuario cadastrado com sucesso.')
    ).toBeInTheDocument()
  })

  it('edita um usuario existente enviando PUT', async () => {
    const user = userEvent.setup()
    const fetchMock = mockApi('ADMIN')
    renderWithProviders(<Users />)

    await screen.findByText('Bruno Lima')
    await user.click(screen.getAllByRole('button', { name: 'Editar' })[1])

    const dialog = screen.getByRole('dialog')
    const nameField = within(dialog).getByLabelText('Nome')
    await user.clear(nameField)
    await user.type(nameField, 'Bruno Lima Junior')
    await user.click(
      within(dialog).getByRole('button', { name: 'Salvar alteracoes' })
    )

    await waitFor(() => {
      const updated = fetchMock.mock.calls.find(
        ([, init]) => init?.method === 'PUT'
      )
      expect(JSON.parse(String(updated?.[1]?.body))).toMatchObject({
        name: 'Bruno Lima Junior'
      })
    })
  })

  it('exclui um usuario apos confirmacao', async () => {
    const user = userEvent.setup()
    const fetchMock = mockApi('ADMIN')
    renderWithProviders(<Users />)

    await screen.findByText('Carla Dias')
    await user.click(screen.getAllByRole('button', { name: 'Excluir' })[1])

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('Carla Dias')
    await user.click(within(dialog).getByRole('button', { name: 'Excluir' }))

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(([, init]) => init?.method === 'DELETE')
      ).toBe(true)
    })
  })

  it('exibe a mensagem de erro da API ao falhar a exclusao', async () => {
    const user = userEvent.setup()
    mockApi('ADMIN', {
      'DELETE http://localhost:3000/api/users/id-client': errorResponse(
        409,
        'LAST_ADMIN',
        'O sistema precisa manter ao menos um Administrador ativo.'
      )
    })

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input)
      if (init?.method === 'DELETE') {
        return errorResponse(
          409,
          'LAST_ADMIN',
          'O sistema precisa manter ao menos um Administrador ativo.'
        )
      }
      if (url.includes('/auth/me'))
        return jsonResponse(makeUser({ id: 'id-admin' }))
      return jsonResponse(listPayload())
    })

    renderWithProviders(<Users />)

    await screen.findByText('Carla Dias')
    await user.click(screen.getAllByRole('button', { name: 'Excluir' })[1])
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Excluir' }))

    expect(
      await screen.findByText(
        'O sistema precisa manter ao menos um Administrador ativo.'
      )
    ).toBeInTheDocument()
  })

  it('aplica o filtro de perfil na consulta enviada a API', async () => {
    const user = userEvent.setup()
    const fetchMock = mockApi('ADMIN')
    renderWithProviders(<Users />)

    await screen.findByText('Ana Souza')
    await user.selectOptions(
      screen.getByLabelText('Perfil de acesso'),
      'CLIENT'
    )

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(([url]) =>
          String(url).includes('role=CLIENT')
        )
      ).toBe(true)
    })
  })

  it('aplica a busca textual na consulta enviada a API', async () => {
    const user = userEvent.setup()
    const fetchMock = mockApi('ADMIN')
    renderWithProviders(<Users />)

    await screen.findByText('Ana Souza')
    await user.type(screen.getByLabelText('Buscar'), 'bruno')

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(([url]) =>
          String(url).includes('search=bruno')
        )
      ).toBe(true)
    })
  })

  it('mostra estado vazio quando a API nao retorna usuarios', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      if (String(input).includes('/auth/me')) return jsonResponse(makeUser())
      return jsonResponse(listPayload([]))
    })

    renderWithProviders(<Users />)

    expect(
      await screen.findByText('Nenhum usuario encontrado')
    ).toBeInTheDocument()
  })
})
