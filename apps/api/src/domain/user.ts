import type { Role, User } from '@organizacion/shared'

export interface UserRecord {
  id: string
  name: string
  email: string
  password_hash: string
  role: Role
  active: number
  created_at: string
  updated_at: string
}

export interface UserWithPassword extends User {
  passwordHash: string
}

export const toUser = (record: UserRecord): User => ({
  id: record.id,
  name: record.name,
  email: record.email,
  role: record.role,
  active: record.active === 1,
  createdAt: record.created_at,
  updatedAt: record.updated_at
})

export const toUserWithPassword = (record: UserRecord): UserWithPassword => ({
  ...toUser(record),
  passwordHash: record.password_hash
})
