import { z } from 'zod'
import { emailSchema, nameSchema, passwordSchema } from './user.schema.js'

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Informe a senha.')
})

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema
})

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Informe o refresh token.')
})

export const logoutSchema = z.object({
  refreshToken: z.string().min(1).optional()
})
