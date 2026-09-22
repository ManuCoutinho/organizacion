import { randomUUID } from 'node:crypto'
import type { Role, User } from '@organizacion/shared'
import { getDatabase } from '../db/index.js'
import {
  toUser,
  toUserWithPassword,
  type UserRecord,
  type UserWithPassword
} from '../domain/user.js'

export interface ListUsersFilter {
  search?: string
  role?: Role
  page: number
  perPage: number
}

export interface CreateUserData {
  name: string
  email: string
  passwordHash: string
  role: Role
}

export interface UpdateUserData {
  name?: string
  email?: string
  role?: Role
  active?: boolean
}

const now = (): string => new Date().toISOString()

export const userRepository = {
  create(data: CreateUserData): User {
    const db = getDatabase()
    const timestamp = now()
    const id = randomUUID()

    db.prepare(
      `INSERT INTO users (id, name, email, password_hash, role, active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?)`
    ).run(
      id,
      data.name,
      data.email,
      data.passwordHash,
      data.role,
      timestamp,
      timestamp
    )

    return this.findById(id) as User
  },

  findById(id: string): User | null {
    const record = getDatabase()
      .prepare('SELECT * FROM users WHERE id = ?')
      .get(id) as UserRecord | undefined
    return record ? toUser(record) : null
  },

  findByEmail(email: string): UserWithPassword | null {
    const record = getDatabase()
      .prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE')
      .get(email) as UserRecord | undefined
    return record ? toUserWithPassword(record) : null
  },

  findCredentialsById(id: string): UserWithPassword | null {
    const record = getDatabase()
      .prepare('SELECT * FROM users WHERE id = ?')
      .get(id) as UserRecord | undefined
    return record ? toUserWithPassword(record) : null
  },

  list(filter: ListUsersFilter): { data: User[]; total: number } {
    const db = getDatabase()
    const conditions: string[] = []
    const params: (string | number)[] = []

    if (filter.search) {
      conditions.push(
        '(name LIKE ? COLLATE NOCASE OR email LIKE ? COLLATE NOCASE)'
      )
      params.push(`%${filter.search}%`, `%${filter.search}%`)
    }

    if (filter.role) {
      conditions.push('role = ?')
      params.push(filter.role)
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const { total } = db
      .prepare(`SELECT COUNT(*) AS total FROM users ${where}`)
      .get(...params) as { total: number }

    const offset = (filter.page - 1) * filter.perPage
    const records = db
      .prepare(
        `SELECT * FROM users ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
      )
      .all(...params, filter.perPage, offset) as unknown as UserRecord[]

    return { data: records.map(toUser), total }
  },

  update(id: string, data: UpdateUserData): User | null {
    const fields: string[] = []
    const params: (string | number)[] = []

    if (data.name !== undefined) {
      fields.push('name = ?')
      params.push(data.name)
    }
    if (data.email !== undefined) {
      fields.push('email = ?')
      params.push(data.email)
    }
    if (data.role !== undefined) {
      fields.push('role = ?')
      params.push(data.role)
    }
    if (data.active !== undefined) {
      fields.push('active = ?')
      params.push(data.active ? 1 : 0)
    }

    if (!fields.length) return this.findById(id)

    fields.push('updated_at = ?')
    params.push(now(), id)

    getDatabase()
      .prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`)
      .run(...params)

    return this.findById(id)
  },

  updatePassword(id: string, passwordHash: string): void {
    getDatabase()
      .prepare(
        'UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?'
      )
      .run(passwordHash, now(), id)
  },

  remove(id: string): boolean {
    const result = getDatabase()
      .prepare('DELETE FROM users WHERE id = ?')
      .run(id)
    return result.changes > 0
  },

  countByRole(role: Role): number {
    const { total } = getDatabase()
      .prepare(
        'SELECT COUNT(*) AS total FROM users WHERE role = ? AND active = 1'
      )
      .get(role) as { total: number }
    return total
  },

  count(): number {
    const { total } = getDatabase()
      .prepare('SELECT COUNT(*) AS total FROM users')
      .get() as { total: number }
    return total
  }
}
