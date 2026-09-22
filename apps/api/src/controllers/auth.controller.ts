import type { Request, Response } from 'express'
import type { LoginPayload, RegisterPayload } from '@organizacion/shared'
import { authService } from '../services/auth.service.js'
import { HttpError } from '../utils/http-error.js'

export const authController = {
  async login(request: Request, response: Response): Promise<void> {
    const session = await authService.login(request.body as LoginPayload)
    response.status(200).json(session)
  },

  async register(request: Request, response: Response): Promise<void> {
    const session = await authService.register(request.body as RegisterPayload)
    response.status(201).json(session)
  },

  async refresh(request: Request, response: Response): Promise<void> {
    const { refreshToken } = request.body as { refreshToken: string }
    const session = await authService.refresh(refreshToken)
    response.status(200).json(session)
  },

  async logout(request: Request, response: Response): Promise<void> {
    const { refreshToken } = request.body as { refreshToken?: string }
    if (!request.auth) throw HttpError.unauthorized()
    await authService.logout(refreshToken, request.auth.id)
    response.status(204).send()
  },

  async me(request: Request, response: Response): Promise<void> {
    if (!request.auth) throw HttpError.unauthorized()
    const user = await authService.me(request.auth.id)
    response.status(200).json(user)
  }
}
