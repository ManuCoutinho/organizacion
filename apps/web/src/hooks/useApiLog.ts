import { useSyncExternalStore } from 'react'
import { apiLog, type ApiLogEntry } from '@/lib/api-log'

export const useApiLog = (): ApiLogEntry[] =>
  useSyncExternalStore(apiLog.subscribe, apiLog.getAll, apiLog.getAll)
