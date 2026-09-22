import type {
  ApiErrorBody,
  ApiErrorIssue,
  AuthSession
} from '@organizacion/shared'
import { apiLog } from './api-log'
import { sessionStorageAdapter } from './storage'

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api'

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly issues: ApiErrorIssue[]

  constructor(status: number, body: ApiErrorBody | null, fallback: string) {
    super(body?.error?.message ?? fallback)
    this.name = 'ApiError'
    this.status = status
    this.code = body?.error?.code ?? 'UNKNOWN_ERROR'
    this.issues = body?.error?.issues ?? []
  }

  issueFor(field: string): string | undefined {
    return this.issues.find((issue) => issue.path === field)?.message
  }
}

interface RequestOptions {
  method?: string
  body?: unknown
  auth?: boolean
  signal?: AbortSignal
}

let onUnauthenticated: (() => void) | null = null

export const setUnauthenticatedHandler = (handler: () => void): void => {
  onUnauthenticated = handler
}

const parseBody = async (response: Response): Promise<unknown> => {
  if (response.status === 204) return null
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

const refreshSession = async (): Promise<boolean> => {
  const stored = sessionStorageAdapter.read()
  if (!stored?.refreshToken) return false

  const response = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: stored.refreshToken })
  })

  if (!response.ok) return false

  const session = (await response.json()) as AuthSession
  sessionStorageAdapter.write({
    accessToken: session.accessToken,
    refreshToken: session.refreshToken
  })
  return true
}

const execute = async <T>(
  path: string,
  options: RequestOptions,
  retrying = false
): Promise<T> => {
  const method = options.method ?? 'GET'
  const headers: Record<string, string> = {}

  if (options.body !== undefined) headers['Content-Type'] = 'application/json'

  if (options.auth !== false) {
    const token = sessionStorageAdapter.read()?.accessToken
    if (token) headers.Authorization = `Bearer ${token}`
  }

  const startedAt = performance.now()
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    signal: options.signal,
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  })
  const payload = await parseBody(response)

  apiLog.push({
    method,
    url: `${BASE_URL}${path}`,
    status: response.status,
    statusText: response.statusText || (response.ok ? 'OK' : 'Error'),
    durationMs: Math.round(performance.now() - startedAt),
    requestBody: options.body,
    responseBody: payload
  })

  if (response.ok) return payload as T

  if (response.status === 401 && options.auth !== false && !retrying) {
    if (await refreshSession()) {
      return execute<T>(path, options, true)
    }
    sessionStorageAdapter.clear()
    onUnauthenticated?.()
  }

  throw new ApiError(
    response.status,
    payload as ApiErrorBody | null,
    'Nao foi possivel completar a requisicao.'
  )
}

export const api = {
  get: <T>(path: string, options: RequestOptions = {}) =>
    execute<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options: RequestOptions = {}) =>
    execute<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options: RequestOptions = {}) =>
    execute<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options: RequestOptions = {}) =>
    execute<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options: RequestOptions = {}) =>
    execute<T>(path, { ...options, method: 'DELETE' })
}
