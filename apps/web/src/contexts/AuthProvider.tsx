import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react'
import type { AuthSession, Role, User } from '@organizacion/shared'
import { api, setUnauthenticatedHandler } from '@/lib/api'
import { sessionStorageAdapter } from '@/lib/storage'
import { AuthContext, type AuthContextValue } from './auth-context'

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const persist = useCallback((session: AuthSession) => {
    sessionStorageAdapter.write({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken
    })
    setUser(session.user)
  }, [])

  const refreshUser = useCallback(async () => {
    if (!sessionStorageAdapter.read()?.accessToken) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      setUser(await api.get<User>('/auth/me'))
    } catch {
      sessionStorageAdapter.clear()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setUnauthenticatedHandler(() => setUser(null))
    void refreshUser()
  }, [refreshUser])

  const signIn = useCallback(
    async (email: string, password: string) => {
      persist(
        await api.post<AuthSession>(
          '/auth/login',
          { email, password },
          { auth: false }
        )
      )
    },
    [persist]
  )

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      persist(
        await api.post<AuthSession>(
          '/auth/register',
          { name, email, password },
          { auth: false }
        )
      )
    },
    [persist]
  )

  const signOut = useCallback(async () => {
    const stored = sessionStorageAdapter.read()
    try {
      if (stored?.accessToken) {
        await api.post('/auth/logout', { refreshToken: stored.refreshToken })
      }
    } catch {
      /* a sessao local e encerrada mesmo se a API falhar */
    } finally {
      sessionStorageAdapter.clear()
      setUser(null)
    }
  }, [])

  const can = useCallback(
    (...roles: Role[]) => !!user && roles.includes(user.role),
    [user]
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      signIn,
      signUp,
      signOut,
      refreshUser,
      can
    }),
    [user, loading, signIn, signUp, signOut, refreshUser, can]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
