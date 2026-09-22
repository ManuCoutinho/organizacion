import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Profile } from '@/pages/Profile'
import { AppShell } from '@/components/layout/AppShell'
import {
  errorResponse,
  jsonResponse,
  makeUser,
  renderWithProviders,
  seedSession
} from '../test/helpers'

describe('<Profile />', () => {
  beforeEach(seedSession)

  it('apresenta os dados e as permissoes do perfil autenticado', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse(makeUser({ role: 'CLIENT', name: 'Carla Dias' }))
    )

    renderWithProviders(<Profile />)

    expect(
      await screen.findByRole('heading', { name: 'Carla Dias' })
    ).toBeInTheDocument()
    expect(screen.getByText('Permissoes do perfil Cliente')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Acesso restrito: visualiza e edita apenas o proprio cadastro.'
      )
    ).toBeInTheDocument()
  })

  it('atualiza os dados cadastrais via PUT', async () => {
    const user = userEvent.setup()
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => jsonResponse(makeUser()))

    renderWithProviders(<Profile />)

    const nameField = await screen.findByLabelText('Nome')
    await user.clear(nameField)
    await user.type(nameField, 'Ana Souza Prado')
    await user.click(screen.getByRole('button', { name: 'Salvar alteracoes' }))

    await waitFor(() => {
      const put = fetchMock.mock.calls.find(
        ([, init]) => init?.method === 'PUT'
      )
      expect(JSON.parse(String(put?.[1]?.body))).toMatchObject({
        name: 'Ana Souza Prado'
      })
    })
    expect(
      await screen.findByText('Dados atualizados com sucesso.')
    ).toBeInTheDocument()
  })

  it('altera a senha exigindo a senha atual', async () => {
    const user = userEvent.setup()
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async (input, init) => {
        if (init?.method === 'PATCH') return jsonResponse(null, 204)
        if (String(input).includes('/auth/me')) return jsonResponse(makeUser())
        return jsonResponse({})
      })

    renderWithProviders(<Profile />)

    await user.type(await screen.findByLabelText('Senha atual'), 'Admin@12345')
    await user.type(screen.getByLabelText('Nova senha'), 'NovaSenha@1')
    await user.click(screen.getByRole('button', { name: 'Atualizar senha' }))

    await waitFor(() => {
      const patch = fetchMock.mock.calls.find(
        ([, init]) => init?.method === 'PATCH'
      )
      expect(JSON.parse(String(patch?.[1]?.body))).toEqual({
        currentPassword: 'Admin@12345',
        newPassword: 'NovaSenha@1'
      })
    })
    expect(
      await screen.findByText(
        'Senha alterada. As outras sessoes foram encerradas.'
      )
    ).toBeInTheDocument()
  })

  it('exibe o erro de campo quando a senha atual esta incorreta', async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      if (init?.method === 'PATCH') {
        return errorResponse(400, 'VALIDATION_ERROR', 'Dados invalidos.', [
          { path: 'currentPassword', message: 'Senha atual incorreta.' }
        ])
      }
      if (String(input).includes('/auth/me')) return jsonResponse(makeUser())
      return jsonResponse({})
    })

    renderWithProviders(<Profile />)

    await user.type(await screen.findByLabelText('Senha atual'), 'Errada@123')
    await user.type(screen.getByLabelText('Nova senha'), 'NovaSenha@1')
    await user.click(screen.getByRole('button', { name: 'Atualizar senha' }))

    expect(
      await screen.findByText('Senha atual incorreta.')
    ).toBeInTheDocument()
  })
})

describe('<AppShell />', () => {
  beforeEach(seedSession)

  it('mostra o menu de usuarios para perfis com permissao de consulta', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse(makeUser({ role: 'OPERATOR' }))
    )

    renderWithProviders(<AppShell />)

    expect(
      await screen.findByRole('link', { name: 'Usuarios' })
    ).toBeInTheDocument()
  })

  it('oculta o menu de usuarios para o perfil Cliente', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse(makeUser({ role: 'CLIENT' }))
    )

    renderWithProviders(<AppShell />)

    await screen.findByRole('link', { name: 'Meu perfil' })
    expect(screen.queryByRole('link', { name: 'Usuarios' })).toBeNull()
  })

  it('encerra a sessao ao clicar em sair', async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      if (init?.method === 'POST') return jsonResponse(null, 204)
      if (String(input).includes('/auth/me')) return jsonResponse(makeUser())
      return jsonResponse({})
    })

    renderWithProviders(<AppShell />)

    await user.click(await screen.findByRole('button', { name: 'Sair' }))

    await waitFor(() => {
      expect(window.localStorage.getItem('organizacion.session')).toBeNull()
    })
  })
})
