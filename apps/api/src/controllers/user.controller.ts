import type { Request, Response } from 'express'
import type { Role } from '@organizacion/shared'
import { userService } from '../services/user.service.js'
import { validated } from '../middlewares/validate.js'
import { HttpError } from '../utils/http-error.js'
import type { Actor } from '../policies/user.policy.js'

const actorOf = (request: Request): Actor => {
  if (!request.auth) throw HttpError.unauthorized()
  return { id: request.auth.id, role: request.auth.role }
}

interface ListQuery {
  search?: string
  role?: Role
  page: number
  perPage: number
}

export const userController = {
  async list(request: Request, response: Response): Promise<void> {
    const query = validated<ListQuery>(request, 'query')
    const result = await userService.list(actorOf(request), query)
    response.status(200).json(result)
  },

  async show(request: Request, response: Response): Promise<void> {
    const { id } = validated<{ id: string }>(request, 'params')
    const user = await userService.getById(actorOf(request), id)
    response.status(200).json(user)
  },

  async create(request: Request, response: Response): Promise<void> {
    const user = await userService.create(actorOf(request), request.body)
    response.status(201).location(`/api/users/${user.id}`).json(user)
  },

  async update(request: Request, response: Response): Promise<void> {
    const { id } = validated<{ id: string }>(request, 'params')
    const user = await userService.update(actorOf(request), id, request.body)
    response.status(200).json(user)
  },

  async remove(request: Request, response: Response): Promise<void> {
    const { id } = validated<{ id: string }>(request, 'params')
    await userService.remove(actorOf(request), id)
    response.status(204).send()
  },

  async changePassword(request: Request, response: Response): Promise<void> {
    const { id } = validated<{ id: string }>(request, 'params')
    await userService.changePassword(actorOf(request), id, request.body)
    response.status(204).send()
  }
}
