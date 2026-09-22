import express, { type Express } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import swaggerUi from 'swagger-ui-express'
import { corsOriginHandler } from './config/cors.js'
import { routes } from './routes/index.js'
import { apiRateLimiter } from './middlewares/rate-limit.js'
import { errorHandler, notFoundHandler } from './middlewares/error-handler.js'
import { openapiDocument } from './docs/openapi.js'

export const createApp = (): Express => {
  const app = express()

  app.disable('x-powered-by')
  app.set('trust proxy', 1)

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
  app.use(cors({ origin: corsOriginHandler, credentials: true }))
  app.use(express.json({ limit: '100kb' }))
  app.use(apiRateLimiter)

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiDocument))
  app.get('/api/openapi.json', (_request, response) => {
    response.json(openapiDocument)
  })

  app.use('/api', routes)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
