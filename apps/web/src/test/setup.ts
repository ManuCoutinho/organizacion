import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { apiLog } from '@/lib/api-log'

afterEach(() => {
  cleanup()
  apiLog.clear()
  window.localStorage.clear()
  vi.restoreAllMocks()
})
