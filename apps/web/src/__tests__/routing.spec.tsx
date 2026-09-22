import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { App } from '@/App'
import { AuthProvider } from '@/contexts/AuthProvider'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { jsonResponse, makeUser, seedSession } from '../test/helpers'

const renderGuard = (
  initialEntry: string,
  roles?: Array<'ADMIN' | 'OPERATOR' | 'CLIENT'>
) =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AuthProvider>
        <Routes>
          <Route path='/login' element={<p>tela de login</p>} />
          <Route path='/perfil' element={<p>tela de perfil</p>} />
          <Route element={<ProtectedRoute roles={roles} />}>
            <Route path='/usuarios' element={<p>tela de usuarios</p>} />
          </Route>
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  )

describe('<ProtectedRoute />', () => {
  it('redireciona para o login quando nao ha sessao', async () => {
    renderGuard('/usuarios')

    expect(await screen.findByText('tela de login')).toBeInTheDocument()
  })

  it('libera a rota para um perfil autorizado', async () => {
    seedSession()
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
      jsonResponse(makeUser({ role: 'ADMIN' }))
    )

    renderGuard('/usuarios', ['ADMIN', 'OPERATOR'])

    expect(await screen.findByText('tela de usuarios')).toBeInTheDocument()
  })

  it('redireciona para o perfil quando o papel nao esta autorizado', async () => {
    seedSession()
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
      jsonResponse(makeUser({ role: 'CLIENT' }))
    )

    renderGuard('/usuarios', ['ADMIN', 'OPERATOR'])

    expect(await screen.findByText('tela de perfil')).toBeInTheDocument()
  })

  it('exibe o carregamento enquanto a sessao e validada', () => {
    seedSession()
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      () => new Promise(() => undefined)
    )

    renderGuard('/usuarios')

    expect(screen.getByText('Validando sessao...')).toBeInTheDocument()
  })
})

describe('<App />', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/')
  })

  it('apresenta a tela de login para visitantes anonimos', async () => {
    render(<App />)

    expect(
      await screen.findByRole('heading', { name: 'Entrar' })
    ).toBeInTheDocument()
  })

  it('renderiza a pagina 404 para rotas desconhecidas', async () => {
    window.history.pushState({}, '', '/rota-inexistente')

    render(<App />)

    expect(await screen.findByText('404')).toBeInTheDocument()
  })
})
