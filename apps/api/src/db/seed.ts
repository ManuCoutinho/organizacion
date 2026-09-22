import type { Role } from '@organizacion/shared'
import { env } from '../config/env.js'
import { userRepository } from '../repositories/user.repository.js'
import { hashPassword } from '../utils/password.js'

interface SeedUser {
  name: string
  email: string
  password: string
  role: Role
}

export const seedUsers = async (): Promise<void> => {
  if (userRepository.count() > 0) return

  const users: SeedUser[] = [
    {
      name: 'Administrador Geral',
      email: env.SEED_ADMIN_EMAIL,
      password: env.SEED_ADMIN_PASSWORD,
      role: 'ADMIN'
    },
    {
      name: 'Operador Suporte',
      email: 'operador@organizacion.dev',
      password: 'Operador@123',
      role: 'OPERATOR'
    },
    {
      name: 'Cliente Demonstracao',
      email: 'cliente@organizacion.dev',
      password: 'Cliente@123',
      role: 'CLIENT'
    }
  ]

  for (const user of users) {
    userRepository.create({
      name: user.name,
      email: user.email,
      passwordHash: await hashPassword(user.password),
      role: user.role
    })
  }
}
