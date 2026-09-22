import { Router } from 'express'
import { authRoutes } from './auth.routes.js'
import { userRoutes } from './user.routes.js'
import { ROLE_DESCRIPTIONS, ROLES } from '@organizacion/shared'

export const routes = Router()

routes.get('/health', (_request, response) => {
  response.status(200).json({
    status: 'ok',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString()
  })
})

routes.get('/roles', (_request, response) => {
  response
    .status(200)
    .json(ROLES.map((role) => ({ role, description: ROLE_DESCRIPTIONS[role] })))
})

routes.use('/auth', authRoutes)
routes.use('/users', userRoutes)
