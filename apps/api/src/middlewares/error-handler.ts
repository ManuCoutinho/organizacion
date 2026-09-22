import type { NextFunction, Request, Response } from 'express'
import { ERROR_CODES, type ApiErrorBody } from '@organizacion/shared'
import { env } from '../config/env.js'
import { HttpError } from '../utils/http-error.js'

export const notFoundHandler = (
  request: Request,
  _response: Response,
  next: NextFunction
): void => {
  next(
    HttpError.notFound(
      `Rota nao encontrada: ${request.method} ${request.originalUrl}`
    )
  )
}

export const errorHandler = (
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction
): void => {
  if (error instanceof HttpError) {
    const body: ApiErrorBody = {
      error: {
        code: error.code,
        message: error.message,
        ...(error.issues ? { issues: error.issues } : {})
      }
    }
    response.status(error.status).json(body)
    return
  }

  if (!env.isTest) {
    console.error('[api] erro nao tratado:', error)
  }

  response.status(500).json({
    error: {
      code: ERROR_CODES.INTERNAL_ERROR,
      message: 'Erro interno no servidor.'
    }
  } satisfies ApiErrorBody)
}
