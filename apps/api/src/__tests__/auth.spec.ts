import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  app,
  authenticatedAs,
  bearer,
  createUser,
  DEFAULT_PASSWORD,
  login,
  resetState
} from '../test/factory.js'
import { userRepository } from '../repositories/user.repository.js'

describe('POST /api/auth/login', () => {
  beforeEach(resetState)

  it('retorna 200 com sessao completa para credenciais validas', async () => {
    const user = await createUser({ role: 'ADMIN' })

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: DEFAULT_PASSWORD })

    expect(response.status).toBe(200)
    expect(response.body.accessToken).toEqual(expect.any(String))
    expect(response.body.refreshToken).toEqual(expect.any(String))
    expect(response.body.tokenType).toBe('Bearer')
    expect(response.body.expiresIn).toBe(3600)
    expect(response.body.user).toMatchObject({
      email: user.email,
      role: 'ADMIN'
    })
    expect(response.body.user).not.toHaveProperty('passwordHash')
  })

  it('aceita e-mail com letras maiusculas', async () => {
    const user = await createUser()

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email.toUpperCase(), password: DEFAULT_PASSWORD })

    expect(response.status).toBe(200)
  })

  it('retorna 401 para senha incorreta', async () => {
    const user = await createUser()

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'SenhaErrada@1' })

    expect(response.status).toBe(401)
    expect(response.body.error.code).toBe('INVALID_CREDENTIALS')
  })

  it('retorna 401 para e-mail inexistente com a mesma mensagem generica', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ninguem@teste.dev', password: DEFAULT_PASSWORD })

    expect(response.status).toBe(401)
    expect(response.body.error.message).toBe('E-mail ou senha invalidos.')
  })

  it('retorna 400 quando o corpo e invalido', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'sem-arroba', password: '' })

    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('VALIDATION_ERROR')
    expect(response.body.error.issues.length).toBeGreaterThan(0)
  })

  it('retorna 403 para conta desativada', async () => {
    const user = await createUser()
    userRepository.update(user.id, { active: false })

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: DEFAULT_PASSWORD })

    expect(response.status).toBe(403)
  })
})

describe('POST /api/auth/register', () => {
  beforeEach(resetState)

  it('retorna 201 e cria sempre com perfil CLIENT', async () => {
    const response = await request(app).post('/api/auth/register').send({
      name: 'Nova Pessoa',
      email: 'nova@teste.dev',
      password: 'Senha@123',
      role: 'ADMIN'
    })

    expect(response.status).toBe(201)
    expect(response.body.user.role).toBe('CLIENT')
  })

  it('retorna 409 para e-mail ja cadastrado', async () => {
    await createUser({ email: 'duplicado@teste.dev' })

    const response = await request(app).post('/api/auth/register').send({
      name: 'Outra Pessoa',
      email: 'duplicado@teste.dev',
      password: 'Senha@123'
    })

    expect(response.status).toBe(409)
    expect(response.body.error.code).toBe('EMAIL_IN_USE')
  })

  it('retorna 400 para senha fraca', async () => {
    const response = await request(app).post('/api/auth/register').send({
      name: 'Pessoa Fraca',
      email: 'fraca@teste.dev',
      password: 'senha'
    })

    expect(response.status).toBe(400)
  })
})

describe('GET /api/auth/me', () => {
  beforeEach(resetState)

  it('retorna 200 com o usuario do token', async () => {
    const { token, user } = await authenticatedAs('OPERATOR')

    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', bearer(token))

    expect(response.status).toBe(200)
    expect(response.body.id).toBe(user.id)
  })

  it('retorna 401 sem header Authorization', async () => {
    const response = await request(app).get('/api/auth/me')

    expect(response.status).toBe(401)
    expect(response.body.error.code).toBe('UNAUTHENTICATED')
  })

  it('retorna 401 para token malformado', async () => {
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', bearer('token.invalido.aqui'))

    expect(response.status).toBe(401)
  })

  it('retorna 401 quando o esquema nao e Bearer', async () => {
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Basic YWRtaW46MTIz')

    expect(response.status).toBe(401)
  })

  it('retorna 401 quando o usuario do token foi excluido', async () => {
    const { token, user } = await authenticatedAs('CLIENT')
    userRepository.remove(user.id)

    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', bearer(token))

    expect(response.status).toBe(401)
  })

  it('retorna 403 quando a conta e desativada apos a emissao do token', async () => {
    const { token, user } = await authenticatedAs('CLIENT')
    userRepository.update(user.id, { active: false })

    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', bearer(token))

    expect(response.status).toBe(403)
  })

  it('retorna 401 quando o perfil do token diverge do perfil atual', async () => {
    const { token, user } = await authenticatedAs('CLIENT')
    userRepository.update(user.id, { role: 'ADMIN' })

    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', bearer(token))

    expect(response.status).toBe(401)
  })
})

describe('POST /api/auth/refresh e /logout', () => {
  beforeEach(resetState)

  it('renova a sessao e invalida o refresh token anterior', async () => {
    const user = await createUser()
    const session = await login(user.email)

    const renewed = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: session.refreshToken })

    expect(renewed.status).toBe(200)
    expect(renewed.body.refreshToken).not.toBe(session.refreshToken)

    const reused = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: session.refreshToken })

    expect(reused.status).toBe(401)
  })

  it('retorna 401 para refresh token desconhecido', async () => {
    const response = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'token-inexistente' })

    expect(response.status).toBe(401)
  })

  it('retorna 401 ao renovar sessao de usuario desativado', async () => {
    const user = await createUser()
    const session = await login(user.email)
    userRepository.update(user.id, { active: false })

    const response = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: session.refreshToken })

    expect(response.status).toBe(401)
  })

  it('encerra a sessao com 204 e revoga o refresh token', async () => {
    const user = await createUser()
    const session = await login(user.email)

    const logout = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', bearer(session.accessToken))
      .send({ refreshToken: session.refreshToken })

    expect(logout.status).toBe(204)

    const refresh = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: session.refreshToken })

    expect(refresh.status).toBe(401)
  })

  it('revoga todas as sessoes quando o refresh token nao e informado', async () => {
    const user = await createUser()
    const first = await login(user.email)
    const second = await login(user.email)

    await request(app)
      .post('/api/auth/logout')
      .set('Authorization', bearer(first.accessToken))
      .send({})

    const refresh = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: second.refreshToken })

    expect(refresh.status).toBe(401)
  })
})
