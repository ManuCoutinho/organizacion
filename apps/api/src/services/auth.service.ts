import {
  ERROR_CODES,
  type AuthSession,
  type LoginPayload,
  type RegisterPayload,
  type User
} from '@organizacion/shared'
import { env } from '../config/env.js'
import { userRepository } from '../repositories/user.repository.js'
import { refreshTokenRepository } from '../repositories/refresh-token.repository.js'
import { hashPassword, verifyPassword } from '../utils/password.js'
import {
  generateRefreshToken,
  hashRefreshToken,
  signAccessToken
} from '../utils/jwt.js'
import { HttpError } from '../utils/http-error.js'
import { userService } from './user.service.js'

const INVALID_CREDENTIALS = HttpError.unauthorized(
  'E-mail ou senha invalidos.',
  ERROR_CODES.INVALID_CREDENTIALS
)

const issueSession = (user: User): AuthSession => {
  const refreshToken = generateRefreshToken()
  const expiresAt = new Date(Date.now() + env.refreshTokenTtlSeconds * 1000)

  refreshTokenRepository.create(
    user.id,
    hashRefreshToken(refreshToken),
    expiresAt
  )

  return {
    user,
    accessToken: signAccessToken(user),
    refreshToken,
    tokenType: 'Bearer',
    expiresIn: env.accessTokenTtlSeconds
  }
}

export const authService = {
  async login(payload: LoginPayload): Promise<AuthSession> {
    const found = userRepository.findByEmail(payload.email)

    if (!found) {
      await hashPassword(payload.password)
      throw INVALID_CREDENTIALS
    }

    const matches = await verifyPassword(payload.password, found.passwordHash)
    if (!matches) throw INVALID_CREDENTIALS

    if (!found.active) {
      throw HttpError.forbidden('Conta desativada. Procure um Administrador.')
    }

    const { passwordHash: _passwordHash, ...user } = found
    return issueSession(user)
  },

  async register(payload: RegisterPayload): Promise<AuthSession> {
    const user = await userService.register(payload)
    return issueSession(user)
  },

  async refresh(refreshToken: string): Promise<AuthSession> {
    const stored = refreshTokenRepository.findByHash(
      hashRefreshToken(refreshToken)
    )

    if (!stored || stored.revoked_at) {
      throw HttpError.unauthorized('Refresh token invalido ou ja utilizado.')
    }

    if (new Date(stored.expires_at).getTime() < Date.now()) {
      throw HttpError.unauthorized('Refresh token expirado.')
    }

    const user = userRepository.findById(stored.user_id)
    if (!user || !user.active) {
      throw HttpError.unauthorized('Usuario indisponivel para renovacao.')
    }

    refreshTokenRepository.revoke(stored.token_hash)
    return issueSession(user)
  },

  async logout(
    refreshToken: string | undefined,
    userId: string
  ): Promise<void> {
    if (refreshToken) {
      refreshTokenRepository.revoke(hashRefreshToken(refreshToken))
      return
    }
    refreshTokenRepository.revokeAllForUser(userId)
  },

  async me(userId: string): Promise<User> {
    const user = userRepository.findById(userId)
    if (!user) throw HttpError.notFound('Usuario nao encontrado.')
    return user
  }
}
