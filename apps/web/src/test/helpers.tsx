import type { ReactElement, ReactNode } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { AuthSession, Role, User } from '@organizacion/shared'
import { AuthProvider } from '@/contexts/AuthProvider'

export const makeUser = (overrides: Partial<User> = {}): User => ({
  id: '6f1d9b5a-1111-4000-8000-000000000001',
  name: 'Ana Souza',
  email: 'ana@organizacion.dev',
  role: 'ADMIN',
  active: true,
  createdAt: '2026-01-10T12:00:00.000Z',
  updatedAt: '2026-01-10T12:00:00.000Z',
  ...overrides
})

export const makeSession = (user: User = makeUser()): AuthSession => ({
  user,
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  tokenType: 'Bearer',
  expiresIn: 3600
})

export const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: { 'Content-Type': 'application/json' }
  })

export const errorResponse = (
  status: number,
  code: string,
  message: string,
  issues: Array<{ path: string; message: string }> = []
): Response =>
  jsonResponse(
    { error: { code, message, ...(issues.length ? { issues } : {}) } },
    status
  )

export const seedSession = (): void => {
  window.localStorage.setItem(
    'organizacion.session',
    JSON.stringify({
      accessToken: 'access-token',
      refreshToken: 'refresh-token'
    })
  )
}

interface WrapperOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string
}

export const renderWithProviders = (
  ui: ReactElement,
  { route = '/', ...options }: WrapperOptions = {}
) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>{children}</AuthProvider>
    </MemoryRouter>
  )
  return render(ui, { wrapper: Wrapper, ...options })
}

export const authenticatedAs = (role: Role): User => {
  seedSession()
  return makeUser({
    role,
    id: `6f1d9b5a-1111-4000-8000-00000000000${role.length}`
  })
}
