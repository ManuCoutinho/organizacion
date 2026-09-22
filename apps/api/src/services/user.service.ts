import {
  ERROR_CODES,
  type PaginatedUsers,
  type Role,
  type User
} from '@organizacion/shared'
import { userRepository } from '../repositories/user.repository.js'
import { refreshTokenRepository } from '../repositories/refresh-token.repository.js'
import { hashPassword, verifyPassword } from '../utils/password.js'
import { HttpError } from '../utils/http-error.js'
import {
  assertCanChangePassword,
  assertCanCreateUser,
  assertCanDeleteUser,
  assertCanListUsers,
  assertCanReadUser,
  assertCanUpdateUser,
  type Actor
} from '../policies/user.policy.js'

export interface ListUsersInput {
  search?: string
  role?: Role
  page: number
  perPage: number
}

export interface CreateUserInput {
  name: string
  email: string
  password: string
  role: Role
}

export interface UpdateUserInput {
  name?: string
  email?: string
  role?: Role
  active?: boolean
}

const assertEmailAvailable = (email: string, ignoreUserId?: string): void => {
  const existing = userRepository.findByEmail(email)
  if (existing && existing.id !== ignoreUserId) {
    throw HttpError.conflict(
      ERROR_CODES.EMAIL_IN_USE,
      'Este e-mail ja esta cadastrado.'
    )
  }
}

const assertNotLastAdmin = (target: User): void => {
  if (target.role !== 'ADMIN') return
  if (userRepository.countByRole('ADMIN') <= 1) {
    throw HttpError.conflict(
      ERROR_CODES.LAST_ADMIN,
      'O sistema precisa manter ao menos um Administrador ativo.'
    )
  }
}

const getOrFail = (id: string): User => {
  const user = userRepository.findById(id)
  if (!user) throw HttpError.notFound('Usuario nao encontrado.')
  return user
}

export const userService = {
  async list(actor: Actor, input: ListUsersInput): Promise<PaginatedUsers> {
    assertCanListUsers(actor)
    const { data, total } = userRepository.list(input)
    return {
      data,
      meta: {
        total,
        page: input.page,
        perPage: input.perPage,
        totalPages: Math.max(1, Math.ceil(total / input.perPage))
      }
    }
  },

  async getById(actor: Actor, id: string): Promise<User> {
    assertCanReadUser(actor, id)
    return getOrFail(id)
  },

  async create(actor: Actor, input: CreateUserInput): Promise<User> {
    assertCanCreateUser(actor)
    assertEmailAvailable(input.email)
    const passwordHash = await hashPassword(input.password)
    return userRepository.create({
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role
    })
  },

  async register(input: Omit<CreateUserInput, 'role'>): Promise<User> {
    assertEmailAvailable(input.email)
    const passwordHash = await hashPassword(input.password)
    return userRepository.create({
      name: input.name,
      email: input.email,
      passwordHash,
      role: 'CLIENT'
    })
  },

  async update(
    actor: Actor,
    id: string,
    input: UpdateUserInput
  ): Promise<User> {
    const target = getOrFail(id)
    assertCanUpdateUser(actor, target, input)

    if (input.email) assertEmailAvailable(input.email, id)

    const losingAdminRole =
      target.role === 'ADMIN' &&
      input.role !== undefined &&
      input.role !== 'ADMIN'
    const beingDeactivated = target.role === 'ADMIN' && input.active === false

    if (losingAdminRole || beingDeactivated) assertNotLastAdmin(target)

    const updated = userRepository.update(id, input)
    if (!updated) throw HttpError.notFound('Usuario nao encontrado.')

    if (input.role !== undefined || input.active === false) {
      refreshTokenRepository.revokeAllForUser(id)
    }

    return updated
  },

  async remove(actor: Actor, id: string): Promise<void> {
    const target = getOrFail(id)
    assertCanDeleteUser(actor, target)
    assertNotLastAdmin(target)
    userRepository.remove(id)
  },

  async changePassword(
    actor: Actor,
    id: string,
    input: { currentPassword?: string; newPassword: string }
  ): Promise<void> {
    assertCanChangePassword(actor, id)
    const target = userRepository.findCredentialsById(id)
    if (!target) throw HttpError.notFound('Usuario nao encontrado.')

    if (actor.id === id) {
      const matches =
        !!input.currentPassword &&
        (await verifyPassword(input.currentPassword, target.passwordHash))
      if (!matches) {
        throw HttpError.badRequest('A senha atual informada esta incorreta.', [
          { path: 'currentPassword', message: 'Senha atual incorreta.' }
        ])
      }
    }

    userRepository.updatePassword(id, await hashPassword(input.newPassword))
    refreshTokenRepository.revokeAllForUser(id)
  }
}
