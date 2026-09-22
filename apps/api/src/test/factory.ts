import request from 'supertest'
import type { Express } from 'express'
import type { AuthSession, Role } from '@organizacion/shared'
import { createApp } from '../app.js'
import { resetDatabase } from '../db/index.js'
import { userRepository } from '../repositories/user.repository.js'
import { hashPassword } from '../utils/password.js'

export const app: Express = createApp()

export const DEFAULT_PASSWORD = 'Senha@123'

export const resetState = (): void => resetDatabase()

export const createUser = async (
  overrides: Partial<{
    name: string
    email: string
    password: string
    role: Role
  }> = {}
) => {
  const role = overrides.role ?? 'CLIENT'
  const email =
    overrides.email ??
    `${role.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@teste.dev`

  return userRepository.create({
    name: overrides.name ?? `Usuario ${role}`,
    email,
    passwordHash: await hashPassword(overrides.password ?? DEFAULT_PASSWORD),
    role
  })
}

export const login = async (
  email: string,
  password = DEFAULT_PASSWORD
): Promise<AuthSession> => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email, password })
  return response.body as AuthSession
}

export const authenticatedAs = async (role: Role) => {
  const user = await createUser({ role })
  const session = await login(user.email)
  return { user, session, token: session.accessToken }
}

export const bearer = (token: string): string => `Bearer ${token}`
