import { z } from 'zod'
import { ROLES } from '@organizacion/shared'

export const passwordSchema = z
  .string()
  .min(8, 'A senha deve ter no minimo 8 caracteres.')
  .max(72, 'A senha deve ter no maximo 72 caracteres.')
  .regex(/[a-z]/, 'A senha deve conter ao menos uma letra minuscula.')
  .regex(/[A-Z]/, 'A senha deve conter ao menos uma letra maiuscula.')
  .regex(/\d/, 'A senha deve conter ao menos um numero.')

export const nameSchema = z
  .string()
  .trim()
  .min(3, 'O nome deve ter no minimo 3 caracteres.')
  .max(120, 'O nome deve ter no maximo 120 caracteres.')

export const emailSchema = z
  .email('Informe um e-mail valido.')
  .trim()
  .toLowerCase()
  .max(180)

export const roleSchema = z.enum(ROLES)

export const createUserSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  role: roleSchema
})

export const updateUserSchema = z
  .object({
    name: nameSchema.optional(),
    email: emailSchema.optional(),
    role: roleSchema.optional(),
    active: z.boolean().optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Informe ao menos um campo para atualizacao.'
  })

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).optional(),
  newPassword: passwordSchema
})

export const listUsersQuerySchema = z.object({
  search: z.string().trim().min(1).max(120).optional(),
  role: roleSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(100).default(10)
})

export const userIdParamSchema = z.object({
  id: z.uuid('Identificador de usuario invalido.')
})
