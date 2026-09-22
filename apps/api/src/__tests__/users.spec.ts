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

describe('GET /api/users', () => {
  beforeEach(resetState)

  it('retorna 200 com lista paginada para ADMIN', async () => {
    const { token } = await authenticatedAs('ADMIN')
    await createUser({ role: 'CLIENT' })
    await createUser({ role: 'OPERATOR' })

    const response = await request(app)
      .get('/api/users')
      .set('Authorization', bearer(token))

    expect(response.status).toBe(200)
    expect(response.body.data).toHaveLength(3)
    expect(response.body.meta).toMatchObject({ total: 3, page: 1, perPage: 10 })
  })

  it('retorna 200 para OPERATOR', async () => {
    const { token } = await authenticatedAs('OPERATOR')

    const response = await request(app)
      .get('/api/users')
      .set('Authorization', bearer(token))

    expect(response.status).toBe(200)
  })

  it('retorna 403 para CLIENT', async () => {
    const { token } = await authenticatedAs('CLIENT')

    const response = await request(app)
      .get('/api/users')
      .set('Authorization', bearer(token))

    expect(response.status).toBe(403)
    expect(response.body.error.code).toBe('FORBIDDEN')
  })

  it('retorna 401 sem token', async () => {
    const response = await request(app).get('/api/users')

    expect(response.status).toBe(401)
  })

  it('filtra por nome e por perfil', async () => {
    const { token } = await authenticatedAs('ADMIN')
    await createUser({ name: 'Mariana Lopes', role: 'OPERATOR' })
    await createUser({ name: 'Carlos Dias', role: 'CLIENT' })

    const byName = await request(app)
      .get('/api/users?search=mariana')
      .set('Authorization', bearer(token))
    expect(byName.body.data).toHaveLength(1)

    const byRole = await request(app)
      .get('/api/users?role=CLIENT')
      .set('Authorization', bearer(token))
    expect(byRole.body.data).toHaveLength(1)
  })

  it('pagina os resultados', async () => {
    const { token } = await authenticatedAs('ADMIN')
    await createUser()
    await createUser()

    const response = await request(app)
      .get('/api/users?page=2&perPage=2')
      .set('Authorization', bearer(token))

    expect(response.body.data).toHaveLength(1)
    expect(response.body.meta.totalPages).toBe(2)
  })

  it('retorna 400 para parametros de consulta invalidos', async () => {
    const { token } = await authenticatedAs('ADMIN')

    const response = await request(app)
      .get('/api/users?perPage=500')
      .set('Authorization', bearer(token))

    expect(response.status).toBe(400)
  })
})

describe('POST /api/users', () => {
  beforeEach(resetState)

  it('retorna 201 com Location quando criado por ADMIN', async () => {
    const { token } = await authenticatedAs('ADMIN')

    const response = await request(app)
      .post('/api/users')
      .set('Authorization', bearer(token))
      .send({
        name: 'Joana Prado',
        email: 'joana@teste.dev',
        password: 'Senha@123',
        role: 'OPERATOR'
      })

    expect(response.status).toBe(201)
    expect(response.headers.location).toBe(`/api/users/${response.body.id}`)
    expect(response.body).toMatchObject({
      email: 'joana@teste.dev',
      role: 'OPERATOR',
      active: true
    })
    expect(response.body).not.toHaveProperty('password')
  })

  it('retorna 403 para OPERATOR', async () => {
    const { token } = await authenticatedAs('OPERATOR')

    const response = await request(app)
      .post('/api/users')
      .set('Authorization', bearer(token))
      .send({
        name: 'Tentativa Bloqueada',
        email: 'bloqueada@teste.dev',
        password: 'Senha@123',
        role: 'CLIENT'
      })

    expect(response.status).toBe(403)
  })

  it('retorna 403 para CLIENT', async () => {
    const { token } = await authenticatedAs('CLIENT')

    const response = await request(app)
      .post('/api/users')
      .set('Authorization', bearer(token))
      .send({
        name: 'Tentativa Bloqueada',
        email: 'bloqueada2@teste.dev',
        password: 'Senha@123',
        role: 'ADMIN'
      })

    expect(response.status).toBe(403)
  })

  it('retorna 400 para perfil inexistente', async () => {
    const { token } = await authenticatedAs('ADMIN')

    const response = await request(app)
      .post('/api/users')
      .set('Authorization', bearer(token))
      .send({
        name: 'Perfil Invalido',
        email: 'invalido@teste.dev',
        password: 'Senha@123',
        role: 'SUPERUSER'
      })

    expect(response.status).toBe(400)
  })

  it('retorna 409 para e-mail duplicado', async () => {
    const { token } = await authenticatedAs('ADMIN')
    await createUser({ email: 'existente@teste.dev' })

    const response = await request(app)
      .post('/api/users')
      .set('Authorization', bearer(token))
      .send({
        name: 'Duplicado',
        email: 'existente@teste.dev',
        password: 'Senha@123',
        role: 'CLIENT'
      })

    expect(response.status).toBe(409)
  })
})

describe('GET /api/users/:id', () => {
  beforeEach(resetState)

  it('permite que ADMIN consulte qualquer usuario', async () => {
    const { token } = await authenticatedAs('ADMIN')
    const target = await createUser()

    const response = await request(app)
      .get(`/api/users/${target.id}`)
      .set('Authorization', bearer(token))

    expect(response.status).toBe(200)
    expect(response.body.id).toBe(target.id)
  })

  it('permite que CLIENT consulte apenas o proprio cadastro', async () => {
    const { token, user } = await authenticatedAs('CLIENT')

    const own = await request(app)
      .get(`/api/users/${user.id}`)
      .set('Authorization', bearer(token))
    expect(own.status).toBe(200)

    const other = await createUser()
    const forbidden = await request(app)
      .get(`/api/users/${other.id}`)
      .set('Authorization', bearer(token))
    expect(forbidden.status).toBe(403)
  })

  it('retorna 404 para id inexistente', async () => {
    const { token } = await authenticatedAs('ADMIN')

    const response = await request(app)
      .get('/api/users/6f1d9b5a-0000-4000-8000-000000000000')
      .set('Authorization', bearer(token))

    expect(response.status).toBe(404)
  })

  it('retorna 400 para id fora do formato uuid', async () => {
    const { token } = await authenticatedAs('ADMIN')

    const response = await request(app)
      .get('/api/users/123')
      .set('Authorization', bearer(token))

    expect(response.status).toBe(400)
  })
})

describe('PUT /api/users/:id', () => {
  beforeEach(resetState)

  it('permite que ADMIN atualize nome, e-mail e perfil', async () => {
    const { token } = await authenticatedAs('ADMIN')
    const target = await createUser({ role: 'CLIENT' })

    const response = await request(app)
      .put(`/api/users/${target.id}`)
      .set('Authorization', bearer(token))
      .send({
        name: 'Nome Atualizado',
        email: 'atualizado@teste.dev',
        role: 'OPERATOR'
      })

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      name: 'Nome Atualizado',
      email: 'atualizado@teste.dev',
      role: 'OPERATOR'
    })
  })

  it('permite que OPERATOR atualize dados cadastrais de um CLIENT', async () => {
    const { token } = await authenticatedAs('OPERATOR')
    const target = await createUser({ role: 'CLIENT' })

    const response = await request(app)
      .patch(`/api/users/${target.id}`)
      .set('Authorization', bearer(token))
      .send({ name: 'Ajuste Operacional' })

    expect(response.status).toBe(200)
    expect(response.body.name).toBe('Ajuste Operacional')
  })

  it('bloqueia OPERATOR ao tentar alterar o perfil de acesso', async () => {
    const { token } = await authenticatedAs('OPERATOR')
    const target = await createUser({ role: 'CLIENT' })

    const response = await request(app)
      .patch(`/api/users/${target.id}`)
      .set('Authorization', bearer(token))
      .send({ role: 'ADMIN' })

    expect(response.status).toBe(403)
  })

  it('bloqueia OPERATOR ao tentar alterar um ADMIN', async () => {
    const { token } = await authenticatedAs('OPERATOR')
    const target = await createUser({ role: 'ADMIN' })

    const response = await request(app)
      .patch(`/api/users/${target.id}`)
      .set('Authorization', bearer(token))
      .send({ name: 'Tentativa' })

    expect(response.status).toBe(403)
  })

  it('permite que CLIENT atualize apenas o proprio nome', async () => {
    const { token, user } = await authenticatedAs('CLIENT')

    const own = await request(app)
      .patch(`/api/users/${user.id}`)
      .set('Authorization', bearer(token))
      .send({ name: 'Meu Novo Nome' })
    expect(own.status).toBe(200)

    const other = await createUser()
    const forbidden = await request(app)
      .patch(`/api/users/${other.id}`)
      .set('Authorization', bearer(token))
      .send({ name: 'Nome Alheio' })
    expect(forbidden.status).toBe(403)
  })

  it('bloqueia escalonamento de privilegio pelo proprio CLIENT', async () => {
    const { token, user } = await authenticatedAs('CLIENT')

    const response = await request(app)
      .patch(`/api/users/${user.id}`)
      .set('Authorization', bearer(token))
      .send({ role: 'ADMIN' })

    expect(response.status).toBe(403)
  })

  it('retorna 409 ao reutilizar o e-mail de outro usuario', async () => {
    const { token } = await authenticatedAs('ADMIN')
    await createUser({ email: 'ocupado@teste.dev' })
    const target = await createUser()

    const response = await request(app)
      .patch(`/api/users/${target.id}`)
      .set('Authorization', bearer(token))
      .send({ email: 'ocupado@teste.dev' })

    expect(response.status).toBe(409)
  })

  it('retorna 409 ao rebaixar o ultimo administrador ativo', async () => {
    const { token, user } = await authenticatedAs('ADMIN')

    const response = await request(app)
      .patch(`/api/users/${user.id}`)
      .set('Authorization', bearer(token))
      .send({ role: 'CLIENT' })

    expect(response.status).toBe(409)
    expect(response.body.error.code).toBe('LAST_ADMIN')
  })

  it('retorna 409 ao desativar o ultimo administrador ativo', async () => {
    const { token, user } = await authenticatedAs('ADMIN')

    const response = await request(app)
      .patch(`/api/users/${user.id}`)
      .set('Authorization', bearer(token))
      .send({ active: false })

    expect(response.status).toBe(409)
  })

  it('retorna 400 quando nenhum campo e informado', async () => {
    const { token, user } = await authenticatedAs('ADMIN')

    const response = await request(app)
      .patch(`/api/users/${user.id}`)
      .set('Authorization', bearer(token))
      .send({})

    expect(response.status).toBe(400)
  })

  it('retorna 404 ao atualizar usuario inexistente', async () => {
    const { token } = await authenticatedAs('ADMIN')

    const response = await request(app)
      .patch('/api/users/6f1d9b5a-0000-4000-8000-000000000000')
      .set('Authorization', bearer(token))
      .send({ name: 'Fantasma Silva' })

    expect(response.status).toBe(404)
  })
})

describe('DELETE /api/users/:id', () => {
  beforeEach(resetState)

  it('retorna 204 quando o ADMIN exclui outro usuario', async () => {
    const { token } = await authenticatedAs('ADMIN')
    const target = await createUser()

    const response = await request(app)
      .delete(`/api/users/${target.id}`)
      .set('Authorization', bearer(token))

    expect(response.status).toBe(204)

    const check = await request(app)
      .get(`/api/users/${target.id}`)
      .set('Authorization', bearer(token))
    expect(check.status).toBe(404)
  })

  it('retorna 403 para OPERATOR e CLIENT', async () => {
    const target = await createUser()
    const operator = await authenticatedAs('OPERATOR')
    const client = await authenticatedAs('CLIENT')

    const byOperator = await request(app)
      .delete(`/api/users/${target.id}`)
      .set('Authorization', bearer(operator.token))
    expect(byOperator.status).toBe(403)

    const byClient = await request(app)
      .delete(`/api/users/${target.id}`)
      .set('Authorization', bearer(client.token))
    expect(byClient.status).toBe(403)
  })

  it('impede que o ADMIN exclua a si mesmo', async () => {
    const { token, user } = await authenticatedAs('ADMIN')

    const response = await request(app)
      .delete(`/api/users/${user.id}`)
      .set('Authorization', bearer(token))

    expect(response.status).toBe(403)
  })

  it('retorna 409 ao excluir o ultimo administrador ativo', async () => {
    const admin = await authenticatedAs('ADMIN')
    const other = await createUser({ role: 'ADMIN' })

    const removeOther = await request(app)
      .delete(`/api/users/${other.id}`)
      .set('Authorization', bearer(admin.token))
    expect(removeOther.status).toBe(204)

    const secondAdmin = await authenticatedAs('ADMIN')
    const removeFirst = await request(app)
      .delete(`/api/users/${admin.user.id}`)
      .set('Authorization', bearer(secondAdmin.token))
    expect(removeFirst.status).toBe(204)
  })

  it('retorna 404 ao excluir usuario inexistente', async () => {
    const { token } = await authenticatedAs('ADMIN')

    const response = await request(app)
      .delete('/api/users/6f1d9b5a-0000-4000-8000-000000000000')
      .set('Authorization', bearer(token))

    expect(response.status).toBe(404)
  })
})

describe('PATCH /api/users/:id/password', () => {
  beforeEach(resetState)

  it('altera a propria senha exigindo a senha atual', async () => {
    const { token, user } = await authenticatedAs('CLIENT')

    const response = await request(app)
      .patch(`/api/users/${user.id}/password`)
      .set('Authorization', bearer(token))
      .send({ currentPassword: DEFAULT_PASSWORD, newPassword: 'NovaSenha@1' })

    expect(response.status).toBe(204)

    const session = await login(user.email, 'NovaSenha@1')
    expect(session.accessToken).toEqual(expect.any(String))
  })

  it('retorna 400 quando a senha atual esta incorreta', async () => {
    const { token, user } = await authenticatedAs('CLIENT')

    const response = await request(app)
      .patch(`/api/users/${user.id}/password`)
      .set('Authorization', bearer(token))
      .send({ currentPassword: 'Errada@123', newPassword: 'NovaSenha@1' })

    expect(response.status).toBe(400)
  })

  it('permite que ADMIN redefina a senha de terceiros sem a senha atual', async () => {
    const { token } = await authenticatedAs('ADMIN')
    const target = await createUser()

    const response = await request(app)
      .patch(`/api/users/${target.id}/password`)
      .set('Authorization', bearer(token))
      .send({ newPassword: 'RedefinidaPelo@1' })

    expect(response.status).toBe(204)
  })

  it('retorna 403 quando um CLIENT tenta alterar a senha de outro', async () => {
    const { token } = await authenticatedAs('CLIENT')
    const target = await createUser()

    const response = await request(app)
      .patch(`/api/users/${target.id}/password`)
      .set('Authorization', bearer(token))
      .send({ newPassword: 'NovaSenha@1' })

    expect(response.status).toBe(403)
  })

  it('retorna 404 quando o usuario alvo nao existe', async () => {
    const { token } = await authenticatedAs('ADMIN')

    const response = await request(app)
      .patch('/api/users/6f1d9b5a-0000-4000-8000-000000000000/password')
      .set('Authorization', bearer(token))
      .send({ newPassword: 'NovaSenha@1' })

    expect(response.status).toBe(404)
  })
})
