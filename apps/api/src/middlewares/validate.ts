import type { NextFunction, Request, Response } from 'express'
import type { ZodType } from 'zod'
import { HttpError } from '../utils/http-error.js'

type Source = 'body' | 'query' | 'params'

export const validate =
  (schema: ZodType, source: Source = 'body') =>
  (request: Request, _response: Response, next: NextFunction): void => {
    const result = schema.safeParse(request[source])

    if (!result.success) {
      return next(
        HttpError.badRequest(
          'Dados invalidos na requisicao.',
          result.error.issues.map((issue) => ({
            path: issue.path.join('.') || source,
            message: issue.message
          }))
        )
      )
    }

    if (source === 'body') {
      request.body = result.data
    } else {
      Object.defineProperty(request, `validated${source}`, {
        value: result.data,
        writable: true,
        configurable: true
      })
    }

    next()
  }

export const validated = <T>(request: Request, source: Source): T => {
  if (source === 'body') return request.body as T
  return (request as unknown as Record<string, T>)[`validated${source}`]
}
