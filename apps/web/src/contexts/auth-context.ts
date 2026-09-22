import { createContext } from 'react'
import type { Role, User } from '@organizacion/shared'

export interface AuthContextValue {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (name: string, email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
  can: (...roles: Role[]) => boolean
}

export const AuthContext = createContext<AuthContextValue | null>(null)
