export interface ApiLogEntry {
  id: string
  method: string
  url: string
  status: number
  statusText: string
  durationMs: number
  requestBody?: unknown
  responseBody?: unknown
  at: string
}

type Listener = (entries: ApiLogEntry[]) => void

const MAX_ENTRIES = 25

let entries: ApiLogEntry[] = []
const listeners = new Set<Listener>()

const emit = (): void => {
  listeners.forEach((listener) => listener(entries))
}

export const apiLog = {
  push(entry: Omit<ApiLogEntry, 'id' | 'at'>): void {
    entries = [
      {
        ...entry,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        at: new Date().toISOString()
      },
      ...entries
    ].slice(0, MAX_ENTRIES)
    emit()
  },
  clear(): void {
    entries = []
    emit()
  },
  getAll(): ApiLogEntry[] {
    return entries
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }
}
