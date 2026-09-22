import type { Role } from './roles.js'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateUserPayload {
  name: string
  email: string
  password: string
  role: Role
}

export interface UpdateUserPayload {
  name?: string
  email?: string
  role?: Role
  active?: boolean
}

export interface ChangePasswordPayload {
  currentPassword?: string
  newPassword: string
}

export interface PaginatedUsers {
  data: User[]
  meta: {
    total: number
    page: number
    perPage: number
    totalPages: number
  }
}
