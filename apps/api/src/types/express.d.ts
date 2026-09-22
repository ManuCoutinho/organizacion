import type { Role } from '@organizacion/shared'

declare global {
  namespace Express {
    interface Request {
      auth?: {
        id: string
        role: Role
        email: string
      }
    }
  }
}

export {}
