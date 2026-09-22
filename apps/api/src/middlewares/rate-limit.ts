import rateLimit from 'express-rate-limit'
import { ERROR_CODES } from '@organizacion/shared'
import { env } from '../config/env.js'

const message = {
  error: {
    code: ERROR_CODES.RATE_LIMITED,
    message: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
  }
}

export const loginRateLimiter = rateLimit({
  windowMs: env.LOGIN_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
  limit: env.LOGIN_RATE_LIMIT_MAX,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => env.isTest,
  message
})

export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => env.isTest,
  message
})
