const KEY = 'organizacion.session'

export interface StoredSession {
  accessToken: string
  refreshToken: string
}

export const sessionStorageAdapter = {
  read(): StoredSession | null {
    try {
      const raw = window.localStorage.getItem(KEY)
      return raw ? (JSON.parse(raw) as StoredSession) : null
    } catch {
      return null
    }
  },
  write(session: StoredSession): void {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(session))
    } catch {
      /* armazenamento indisponivel */
    }
  },
  clear(): void {
    try {
      window.localStorage.removeItem(KEY)
    } catch {
      /* armazenamento indisponivel */
    }
  }
}
