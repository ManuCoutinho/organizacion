import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  app,
  createUser,
  DEFAULT_PASSWORD,
  resetState
} from '../test/factory.js'
import { isOriginAllowed } from '../config/cors.js'

describe('politica de CORS', () => {
  beforeEach(resetState)

  it('aceita a origem configurada em CORS_ORIGINS', async () => {
    const user = await createUser()

    const response = await request(app)
      .post('/api/auth/login')
      .set('Origin', 'http://localhost:5173')
      .send({ email: user.email, password: DEFAULT_PASSWORD })

    expect(response.status).toBe(200)
    expect(response.headers['access-control-allow-origin']).toBe(
      'http://localhost:5173'
    )
  })

  it('aceita 127.0.0.1 fora de producao, equivalente a localhost', async () => {
    const user = await createUser()

    const response = await request(app)
      .post('/api/auth/login')
      .set('Origin', 'http://127.0.0.1:5173')
      .send({ email: user.email, password: DEFAULT_PASSWORD })

    expect(response.status).toBe(200)
  })

  it('aceita requisicoes sem header Origin (curl, Swagger, testes)', async () => {
    const response = await request(app).get('/api/health')

    expect(response.status).toBe(200)
  })

  it('recusa origem externa com 403 e envelope padrao de erro', async () => {
    const response = await request(app)
      .get('/api/health')
      .set('Origin', 'http://site-malicioso.com')

    expect(response.status).toBe(403)
    expect(response.body.error.code).toBe('CORS_NOT_ALLOWED')
    expect(response.body.error.message).toContain('http://site-malicioso.com')
  })

  it('responde 403 tambem no preflight OPTIONS de origem nao autorizada', async () => {
    const response = await request(app)
      .options('/api/users')
      .set('Origin', 'http://site-malicioso.com')
      .set('Access-Control-Request-Method', 'GET')

    expect(response.status).toBe(403)
  })

  it('ignora barra final ao comparar a origem configurada', () => {
    expect(isOriginAllowed('http://localhost:5173/')).toBe(true)
  })

  it('trata origens malformadas como nao autorizadas', () => {
    expect(isOriginAllowed('nao-e-uma-url')).toBe(false)
    expect(isOriginAllowed('http://evil.com')).toBe(false)
  })

  it('libera qualquer porta de loopback durante o desenvolvimento', () => {
    expect(isOriginAllowed('http://localhost:3000')).toBe(true)
    expect(isOriginAllowed('http://127.0.0.1:8080')).toBe(true)
    expect(isOriginAllowed('http://[::1]:5173')).toBe(true)
  })
})

describe('politica de CORS em producao', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('nao libera loopback automaticamente quando NODE_ENV e production', async () => {
    vi.resetModules()
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('CORS_ORIGINS', 'https://app.organizacion.dev')

    const { isOriginAllowed: inProduction } = await import('../config/cors.js')

    expect(inProduction('https://app.organizacion.dev')).toBe(true)
    expect(inProduction('http://localhost:5173')).toBe(false)
    expect(inProduction('http://127.0.0.1:5173')).toBe(false)
  })
})
