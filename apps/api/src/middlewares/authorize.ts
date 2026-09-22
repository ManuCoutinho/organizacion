import type { NextFunction, Request, Response } from 'express'
import type { Role } from '@organizacion/shared'
import { HttpError } from '../utils/http-error.js'

export const authorize =
  (...allowed: Role[]) =>
  (request: Request, _response: Response, next: NextFunction): void => {
    if (!request.auth) {
      return next(HttpError.unauthorized())
    }
    if (!allowed.includes(request.auth.role)) {
      return next(
        HttpError.forbidden(
          `Recurso restrito aos perfis: ${allowed.join(', ')}.`
        )
      )
    }
    next()
  }
