import {
  ERROR_CODES,
  type ApiErrorIssue,
  type ErrorCode
} from '@organizacion/shared'

export class HttpError extends Error {
  readonly status: number
  readonly code: ErrorCode
  readonly issues?: ApiErrorIssue[]

  constructor(
    status: number,
    code: ErrorCode,
    message: string,
    issues?: ApiErrorIssue[]
  ) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.code = code
    this.issues = issues
  }

  static badRequest(message: string, issues?: ApiErrorIssue[]): HttpError {
    return new HttpError(400, ERROR_CODES.VALIDATION_ERROR, message, issues)
  }

  static unauthorized(
    message = 'Autenticacao obrigatoria.',
    code: ErrorCode = ERROR_CODES.UNAUTHENTICATED
  ): HttpError {
    return new HttpError(401, code, message)
  }

  static forbidden(message = 'Acesso negado para o seu perfil.'): HttpError {
    return new HttpError(403, ERROR_CODES.FORBIDDEN, message)
  }

  static notFound(message = 'Recurso nao encontrado.'): HttpError {
    return new HttpError(404, ERROR_CODES.NOT_FOUND, message)
  }

  static conflict(code: ErrorCode, message: string): HttpError {
    return new HttpError(409, code, message)
  }
}
