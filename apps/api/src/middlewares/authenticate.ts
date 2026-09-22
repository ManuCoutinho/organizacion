import type { NextFunction, Request, Response } from 'express'
import { verifyAccessToken } from '../utils/jwt.js'
import { HttpError } from '../utils/http-error.js'
import { userRepository } from '../repositories/user.repository.js'

export const authenticate = (
  request: Request,
  _response: Response,
  next: NextFunction
): void => {
  const header = request.headers.authorization

  if (!header?.startsWith('Bearer ')) {
    return next(
      HttpError.unauthorized('Envie o token no header Authorization: Bearer.')
    )
  }

  try {
    const claims = verifyAccessToken(header.slice(7).trim())
    const user = userRepository.findById(claims.sub)

    if (!user) {
      return next(HttpError.unauthorized('Usuario do token nao existe mais.'))
    }
    if (!user.active) {
      return next(HttpError.forbidden('Conta desativada.'))
    }
    if (user.role !== claims.role) {
      return next(
        HttpError.unauthorized('Perfil alterado. Autentique-se novamente.')
      )
    }

    request.auth = { id: user.id, role: user.role, email: user.email }
    next()
  } catch (error) {
    next(error)
  }
}
