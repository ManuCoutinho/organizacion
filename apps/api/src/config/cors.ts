import { ERROR_CODES } from '@organizacion/shared'
import { env } from './env.js'
import { HttpError } from '../utils/http-error.js'

const LOOPBACK_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1', '[::1]'])

const isLoopbackOrigin = (origin: string): boolean => {
  try {
    return LOOPBACK_HOSTNAMES.has(new URL(origin).hostname)
  } catch {
    return false
  }
}

export const isOriginAllowed = (origin: string | undefined): boolean => {
  if (!origin) return true
  if (env.corsOrigins.includes(origin.replace(/\/+$/, ''))) return true
  return !env.isProduction && isLoopbackOrigin(origin)
}

export const corsOriginHandler = (
  origin: string | undefined,
  callback: (error: Error | null, allowed?: boolean) => void
): void => {
  if (isOriginAllowed(origin)) return callback(null, true)

  callback(
    new HttpError(
      403,
      ERROR_CODES.CORS_NOT_ALLOWED,
      `Origem nao autorizada pelo CORS: ${origin}. Inclua-a na variavel CORS_ORIGINS.`
    )
  )
}
