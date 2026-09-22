import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api, ApiError, setUnauthenticatedHandler } from '@/lib/api'
import { apiLog } from '@/lib/api-log'
import { sessionStorageAdapter } from '@/lib/storage'
import { errorResponse, jsonResponse, seedSession } from '../test/helpers'

describe('cliente HTTP', () => {
  beforeEach(() => {
    apiLog.clear()
    window.localStorage.clear()
    setUnauthenticatedHandler(() => undefined)
  })

  it('envia o token de acesso no header Authorization', async () => {
    seedSession()
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse({ ok: true }))

    await api.get('/users')

    const [, init] = fetchMock.mock.calls[0]
    expect((init?.headers as Record<string, string>).Authorization).toBe(
      'Bearer access-token'
    )
  })

  it('omite o header Authorization quando auth e false', async () => {
    seedSession()
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse({ ok: true }))

    await api.post('/auth/login', { email: 'a@b.dev' }, { auth: false })

    const [, init] = fetchMock.mock.calls[0]
    expect(
      (init?.headers as Record<string, string>).Authorization
    ).toBeUndefined()
  })

  it('registra cada requisicao no console de API', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ id: 1 }))

    await api.post('/users', { name: 'Teste' }, { auth: false })

    const [entry] = apiLog.getAll()
    expect(entry).toMatchObject({ method: 'POST', status: 200 })
    expect(entry.requestBody).toEqual({ name: 'Teste' })
    expect(entry.responseBody).toEqual({ id: 1 })
  })

  it('converte respostas de erro em ApiError com issues', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      errorResponse(400, 'VALIDATION_ERROR', 'Dados invalidos na requisicao.', [
        { path: 'email', message: 'Informe um e-mail valido.' }
      ])
    )

    const error = (await api
      .post('/auth/login', {}, { auth: false })
      .catch((caught) => caught)) as ApiError

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(400)
    expect(error.code).toBe('VALIDATION_ERROR')
    expect(error.issueFor('email')).toBe('Informe um e-mail valido.')
    expect(error.issueFor('password')).toBeUndefined()
  })

  it('retorna null em respostas 204', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(null, 204))

    await expect(api.delete('/users/1', { auth: false })).resolves.toBeNull()
  })

  it('renova o token automaticamente apos um 401 e repete a chamada', async () => {
    seedSession()
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        errorResponse(401, 'UNAUTHENTICATED', 'Token expirado.')
      )
      .mockResolvedValueOnce(
        jsonResponse({
          accessToken: 'novo-access',
          refreshToken: 'novo-refresh',
          tokenType: 'Bearer',
          expiresIn: 3600,
          user: {}
        })
      )
      .mockResolvedValueOnce(jsonResponse({ data: [] }))

    await expect(api.get('/users')).resolves.toEqual({ data: [] })
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(sessionStorageAdapter.read()?.accessToken).toBe('novo-access')
  })

  it('limpa a sessao e avisa quando a renovacao falha', async () => {
    seedSession()
    const onUnauthenticated = vi.fn()
    setUnauthenticatedHandler(onUnauthenticated)

    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        errorResponse(401, 'UNAUTHENTICATED', 'Token expirado.')
      )
      .mockResolvedValueOnce(
        errorResponse(401, 'UNAUTHENTICATED', 'Refresh invalido.')
      )

    await expect(api.get('/users')).rejects.toBeInstanceOf(ApiError)
    expect(onUnauthenticated).toHaveBeenCalled()
    expect(sessionStorageAdapter.read()).toBeNull()
  })

  it('nao tenta renovar quando nao existe refresh token armazenado', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(errorResponse(401, 'UNAUTHENTICATED', 'Sem token.'))

    await expect(api.get('/users')).rejects.toBeInstanceOf(ApiError)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('trata corpo de resposta que nao e JSON', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('texto puro', { status: 200 })
    )

    await expect(api.get('/health', { auth: false })).resolves.toBe(
      'texto puro'
    )
  })
})

describe('armazenamento de sessao', () => {
  beforeEach(() => window.localStorage.clear())

  it('grava, le e limpa a sessao', () => {
    sessionStorageAdapter.write({ accessToken: 'a', refreshToken: 'b' })
    expect(sessionStorageAdapter.read()).toEqual({
      accessToken: 'a',
      refreshToken: 'b'
    })

    sessionStorageAdapter.clear()
    expect(sessionStorageAdapter.read()).toBeNull()
  })

  it('retorna null quando o conteudo armazenado esta corrompido', () => {
    window.localStorage.setItem('organizacion.session', '{invalido')
    expect(sessionStorageAdapter.read()).toBeNull()
  })
})

describe('registro de chamadas', () => {
  beforeEach(() => apiLog.clear())

  it('notifica assinantes e limita o historico', () => {
    const listener = vi.fn()
    const unsubscribe = apiLog.subscribe(listener)

    for (let index = 0; index < 30; index += 1) {
      apiLog.push({
        method: 'GET',
        url: `/api/users/${index}`,
        status: 200,
        statusText: 'OK',
        durationMs: 5
      })
    }

    expect(apiLog.getAll()).toHaveLength(25)
    expect(apiLog.getAll()[0].url).toBe('/api/users/29')
    expect(listener).toHaveBeenCalled()

    unsubscribe()
    apiLog.clear()
    expect(apiLog.getAll()).toHaveLength(0)
  })
})
