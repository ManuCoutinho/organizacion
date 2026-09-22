import type { Role, User } from '@organizacion/shared'
import { HttpError } from '../utils/http-error.js'

export interface Actor {
  id: string
  role: Role
}

const RESTRICTED_FIELDS = ['role', 'active'] as const

export const assertCanListUsers = (actor: Actor): void => {
  if (actor.role === 'CLIENT') {
    throw HttpError.forbidden(
      'O perfil Cliente pode consultar apenas o proprio cadastro.'
    )
  }
}

export const assertCanReadUser = (actor: Actor, targetId: string): void => {
  if (actor.role === 'CLIENT' && actor.id !== targetId) {
    throw HttpError.forbidden(
      'O perfil Cliente pode consultar apenas o proprio cadastro.'
    )
  }
}

export const assertCanCreateUser = (actor: Actor): void => {
  if (actor.role !== 'ADMIN') {
    throw HttpError.forbidden(
      'Apenas o perfil Administrador pode cadastrar usuarios.'
    )
  }
}

export interface UpdatableFields {
  role?: unknown
  active?: unknown
}

export const assertCanUpdateUser = (
  actor: Actor,
  target: User,
  payload: UpdatableFields
): void => {
  if (actor.role === 'ADMIN') return

  const touchesRestrictedField = RESTRICTED_FIELDS.some(
    (field) => payload[field] !== undefined
  )

  if (touchesRestrictedField) {
    throw HttpError.forbidden(
      'Somente o perfil Administrador pode alterar perfil de acesso ou status.'
    )
  }

  if (actor.role === 'OPERATOR') {
    if (target.role === 'ADMIN' && actor.id !== target.id) {
      throw HttpError.forbidden(
        'O perfil Operador nao pode alterar dados de um Administrador.'
      )
    }
    return
  }

  if (actor.id !== target.id) {
    throw HttpError.forbidden(
      'O perfil Cliente pode atualizar apenas o proprio cadastro.'
    )
  }
}

export const assertCanDeleteUser = (actor: Actor, target: User): void => {
  if (actor.role !== 'ADMIN') {
    throw HttpError.forbidden(
      'Apenas o perfil Administrador pode excluir usuarios.'
    )
  }
  if (actor.id === target.id) {
    throw HttpError.forbidden(
      'Nao e possivel excluir o proprio usuario autenticado.'
    )
  }
}

export const assertCanChangePassword = (
  actor: Actor,
  targetId: string
): void => {
  if (actor.role !== 'ADMIN' && actor.id !== targetId) {
    throw HttpError.forbidden('Voce so pode alterar a propria senha.')
  }
}
