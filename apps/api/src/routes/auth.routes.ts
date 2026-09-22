import { Router } from 'express'
import { authController } from '../controllers/auth.controller.js'
import { validate } from '../middlewares/validate.js'
import { authenticate } from '../middlewares/authenticate.js'
import { loginRateLimiter } from '../middlewares/rate-limit.js'
import {
  loginSchema,
  logoutSchema,
  refreshSchema,
  registerSchema
} from '../schemas/auth.schema.js'

export const authRoutes = Router()

authRoutes.post(
  '/login',
  loginRateLimiter,
  validate(loginSchema),
  authController.login
)
authRoutes.post(
  '/register',
  loginRateLimiter,
  validate(registerSchema),
  authController.register
)
authRoutes.post('/refresh', validate(refreshSchema), authController.refresh)
authRoutes.post(
  '/logout',
  authenticate,
  validate(logoutSchema),
  authController.logout
)
authRoutes.get('/me', authenticate, authController.me)
