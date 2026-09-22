export interface ApiErrorIssue {
  path: string
  message: string
}

export interface ApiErrorBody {
  error: {
    code: string
    message: string
    issues?: ApiErrorIssue[]
  }
}

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  FORBIDDEN: 'FORBIDDEN',
  CORS_NOT_ALLOWED: 'CORS_NOT_ALLOWED',
  NOT_FOUND: 'NOT_FOUND',
  EMAIL_IN_USE: 'EMAIL_IN_USE',
  LAST_ADMIN: 'LAST_ADMIN',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
} as const

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]
