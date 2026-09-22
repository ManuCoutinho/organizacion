import { createApp } from './app.js'
import { env } from './config/env.js'
import { getDatabase } from './db/index.js'
import { seedUsers } from './db/seed.js'

const bootstrap = async (): Promise<void> => {
  getDatabase()
  await seedUsers()

  createApp().listen(env.PORT, () => {
    console.log(`[api] rodando em http://localhost:${env.PORT}`)
    console.log(`[api] documentacao em http://localhost:${env.PORT}/api/docs`)
  })
}

bootstrap().catch((error) => {
  console.error('[api] falha ao iniciar:', error)
  process.exit(1)
})
