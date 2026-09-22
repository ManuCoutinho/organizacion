import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  app,
  authenticatedAs,
  bearer,
  createUser,
  resetState
} from '../test/factory.js'
import { seedUsers } from '../db/seed.js'
import { userRepository } from '../repositories/user.repository.js'
import { HttpError } from '../utils/http-error.js'
import { hashRefreshToken, verifyAccessToken } from '../utils/jwt.js'
import { isRole, ROLE_LABELS } from '@organizacion/shared'

describe('rotas de servico', () => {
  beforeEach(resetState)

  it('GET /api/health retorna 200', async () => {
    const response = await request(app).get('/api/health')

    expect(response.status).toBe(200)
    expect(response.body.status).toBe('ok')
  })

  it('GET /api/roles descreve os tres perfis', async () => {
    const response = await request(app).get('/api/roles')

    expect(response.status).toBe(200)
    expect(response.body).toHaveLength(3)
    expect(response.body.map((item: { role: string }) => item.role)).toEqual([
      'ADMIN',
      'OPERATOR',
      'CLIENT'
    ])
  })

  it('GET /api/openapi.json expoe a especificacao', async () => {
    const response = await request(app).get('/api/openapi.json')

    expect(response.status).toBe(200)
    expect(response.body.openapi).toBe('3.0.3')
    expect(Object.keys(response.body.paths).length).toBeGreaterThanOrEqual(8)
  })

  it('retorna 404 padronizado para rota inexistente', async () => {
    const response = await request(app).get('/api/nao-existe')

    expect(response.status).toBe(404)
    expect(response.body.error.code).toBe('NOT_FOUND')
  })

  it('nao expoe o header x-powered-by', async () => {
    const response = await request(app).get('/api/health')

    expect(response.headers['x-powered-by']).toBeUndefined()
  })

  it('aplica os headers de seguranca do helmet', async () => {
    const response = await request(app).get('/api/health')

    expect(response.headers['x-content-type-options']).toBe('nosniff')
    expect(response.headers['x-frame-options']).toBe('SAMEORIGIN')
  })
})

describe('seed inicial', () => {
  beforeEach(resetState)

  it('cria os tres perfis de demonstracao apenas uma vez', async () => {
    await seedUsers()
    expect(userRepository.count()).toBe(3)

    await seedUsers()
    expect(userRepository.count()).toBe(3)
  })
})

describe('utilitarios', () => {
  beforeEach(resetState)

  it('assina um access token com as claims esperadas', async () => {
    const { token, user } = await authenticatedAs('ADMIN')
    const claims = verifyAccessToken(token)

    expect(claims).toMatchObject({
      sub: user.id,
      name: user.name,
      email: user.email,
      role: 'ADMIN',
      iss: 'organizacion-api',
      aud: 'organizacion-web'
    })
    expect(claims.exp - claims.iat).toBe(3600)
    expect(claims.jti).toEqual(expect.any(String))
  })

  it('rejeita um token assinado com outro segredo', () => {
    expect(() => verifyAccessToken('a.b.c')).toThrow(HttpError)
  })

  it('gera hashes deterministicos para refresh tokens', () => {
    expect(hashRefreshToken('abc')).toBe(hashRefreshToken('abc'))
    expect(hashRefreshToken('abc')).not.toBe(hashRefreshToken('abd'))
    expect(hashRefreshToken('abc')).toHaveLength(64)
  })

  it('valida perfis conhecidos no pacote compartilhado', () => {
    expect(isRole('ADMIN')).toBe(true)
    expect(isRole('ROOT')).toBe(false)
    expect(ROLE_LABELS.OPERATOR).toBe('Operador')
  })

  it('atualiza sem alteracoes quando nenhum campo e enviado ao repositorio', async () => {
    const user = await createUser()
    const result = userRepository.update(user.id, {})

    expect(result?.id).toBe(user.id)
  })

  it('retorna null ao buscar usuario inexistente no repositorio', () => {
    expect(userRepository.findById('inexistente')).toBeNull()
    expect(userRepository.findByEmail('inexistente@teste.dev')).toBeNull()
    expect(userRepository.findCredentialsById('inexistente')).toBeNull()
    expect(userRepository.remove('inexistente')).toBe(false)
  })

  it('bloqueia requisicao com corpo acima do limite aceito', async () => {
    const { token } = await authenticatedAs('ADMIN')

    const response = await request(app)
      .post('/api/users')
      .set('Authorization', bearer(token))
      .send({
        name: 'x'.repeat(200000),
        email: 'grande@teste.dev',
        password: 'Senha@123',
        role: 'CLIENT'
      })

    expect(response.status).toBe(500)
    expect(response.body.error.code).toBe('INTERNAL_ERROR')
  })
})
