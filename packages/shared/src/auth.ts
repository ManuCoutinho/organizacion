import type { Role } from './roles.js'
import type { User } from './user.js'

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  tokenType: 'Bearer'
  expiresIn: number
}

export interface AuthSession extends AuthTokens {
  user: User
}

export interface AccessTokenClaims {
  sub: string
  name: string
  email: string
  role: Role
  iat: number
  exp: number
  iss: string
  aud: string
  jti: string
}
