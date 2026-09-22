import { randomUUID, createHash } from 'node:crypto'
import jwt from 'jsonwebtoken'
import type { AccessTokenClaims, User } from '@organizacion/shared'
import { env } from '../config/env.js'
import { HttpError } from './http-error.js'

export const signAccessToken = (user: User): string =>
  jwt.sign(
    {
      name: user.name,
      email: user.email,
      role: user.role
    },
    env.JWT_SECRET,
    {
      subject: user.id,
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
      expiresIn: env.accessTokenTtlSeconds,
      jwtid: randomUUID()
    }
  )

export const verifyAccessToken = (token: string): AccessTokenClaims => {
  try {
    return jwt.verify(token, env.JWT_SECRET, {
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE
    }) as AccessTokenClaims
  } catch (error) {
    const expired = error instanceof jwt.TokenExpiredError
    throw HttpError.unauthorized(
      expired ? 'Token expirado. Faca login novamente.' : 'Token invalido.'
    )
  }
}

export const generateRefreshToken = (): string =>
  `${randomUUID()}.${randomUUID()}`

export const hashRefreshToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex')
