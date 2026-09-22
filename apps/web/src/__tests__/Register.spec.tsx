import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Register } from '@/pages/Register'
import {
  errorResponse,
  jsonResponse,
  makeSession,
  makeUser,
  renderWithProviders
} from '../test/helpers'

describe('<Register />', () => {
  it('cria a conta e persiste a sessao retornada', async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse(makeSession(makeUser({ role: 'CLIENT' })), 200)
    )

    renderWithProviders(<Register />)

    await user.type(screen.getByLabelText('Nome completo'), 'Nova Pessoa')
    await user.type(screen.getByLabelText('E-mail'), 'nova@organizacion.dev')
    await user.type(screen.getByLabelText('Senha'), 'Senha@123')
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    await waitFor(() => {
      expect(window.localStorage.getItem('organizacion.session')).toContain(
        'refresh-token'
      )
    })
  })

  it('exibe conflito de e-mail ja cadastrado', async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      errorResponse(409, 'EMAIL_IN_USE', 'Este e-mail ja esta cadastrado.')
    )

    renderWithProviders(<Register />)

    await user.type(screen.getByLabelText('Nome completo'), 'Nova Pessoa')
    await user.type(screen.getByLabelText('E-mail'), 'ana@organizacion.dev')
    await user.type(screen.getByLabelText('Senha'), 'Senha@123')
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Este e-mail ja esta cadastrado.'
    )
  })

  it('destaca o campo de senha quando a API recusa a forca da senha', async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      errorResponse(400, 'VALIDATION_ERROR', 'Dados invalidos.', [
        {
          path: 'password',
          message: 'A senha deve ter no minimo 8 caracteres.'
        }
      ])
    )

    renderWithProviders(<Register />)

    await user.type(screen.getByLabelText('Nome completo'), 'Nova Pessoa')
    await user.type(screen.getByLabelText('E-mail'), 'nova@organizacion.dev')
    await user.type(screen.getByLabelText('Senha'), '123')
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(
      await screen.findByText('A senha deve ter no minimo 8 caracteres.')
    ).toBeInTheDocument()
  })
})
