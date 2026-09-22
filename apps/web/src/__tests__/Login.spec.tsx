import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Login } from '@/pages/Login'
import {
  errorResponse,
  jsonResponse,
  makeSession,
  renderWithProviders
} from '../test/helpers'

describe('<Login />', () => {
  it('exibe o formulario de autenticacao', () => {
    renderWithProviders(<Login />)

    expect(screen.getByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument()
    expect(screen.getByLabelText('Senha')).toBeInTheDocument()
  })

  it('preenche as credenciais ao escolher uma conta de demonstracao', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Login />)

    await user.click(screen.getByRole('button', { name: 'Operador' }))

    expect(screen.getByLabelText('E-mail')).toHaveValue(
      'operador@organizacion.dev'
    )
    expect(screen.getByLabelText('Senha')).toHaveValue('Operador@123')
  })

  it('autentica e guarda a sessao no armazenamento local', async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(makeSession()))

    renderWithProviders(<Login />)

    await user.type(screen.getByLabelText('E-mail'), 'ana@organizacion.dev')
    await user.type(screen.getByLabelText('Senha'), 'Admin@12345')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    await waitFor(() => {
      expect(window.localStorage.getItem('organizacion.session')).toContain(
        'access-token'
      )
    })
  })

  it('mostra a mensagem retornada pela API em credenciais invalidas', async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      errorResponse(401, 'INVALID_CREDENTIALS', 'E-mail ou senha invalidos.')
    )

    renderWithProviders(<Login />)

    await user.type(screen.getByLabelText('E-mail'), 'ana@organizacion.dev')
    await user.type(screen.getByLabelText('Senha'), 'errada')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'E-mail ou senha invalidos.'
    )
  })

  it('exibe erros de validacao por campo', async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      errorResponse(400, 'VALIDATION_ERROR', 'Dados invalidos.', [
        { path: 'email', message: 'Informe um e-mail valido.' }
      ])
    )

    renderWithProviders(<Login />)

    await user.type(screen.getByLabelText('E-mail'), 'sem-arroba')
    await user.type(screen.getByLabelText('Senha'), 'Senha@123')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(
      await screen.findByText('Informe um e-mail valido.')
    ).toBeInTheDocument()
  })

  it('informa falha de rede quando o fetch rejeita', async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'))

    renderWithProviders(<Login />)

    await user.type(screen.getByLabelText('E-mail'), 'ana@organizacion.dev')
    await user.type(screen.getByLabelText('Senha'), 'Admin@12345')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Falha de comunicacao com a API.'
    )
  })
})
