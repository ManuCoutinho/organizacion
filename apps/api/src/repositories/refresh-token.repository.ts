import { randomUUID } from 'node:crypto'
import { getDatabase } from '../db/index.js'

export interface RefreshTokenRecord {
  id: string
  user_id: string
  token_hash: string
  expires_at: string
  revoked_at: string | null
  created_at: string
}

export const refreshTokenRepository = {
  create(userId: string, tokenHash: string, expiresAt: Date): void {
    getDatabase()
      .prepare(
        `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, created_at)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(
        randomUUID(),
        userId,
        tokenHash,
        expiresAt.toISOString(),
        new Date().toISOString()
      )
  },

  findByHash(tokenHash: string): RefreshTokenRecord | null {
    const record = getDatabase()
      .prepare('SELECT * FROM refresh_tokens WHERE token_hash = ?')
      .get(tokenHash) as RefreshTokenRecord | undefined
    return record ?? null
  },

  revoke(tokenHash: string): void {
    getDatabase()
      .prepare('UPDATE refresh_tokens SET revoked_at = ? WHERE token_hash = ?')
      .run(new Date().toISOString(), tokenHash)
  },

  revokeAllForUser(userId: string): void {
    getDatabase()
      .prepare(
        'UPDATE refresh_tokens SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL'
      )
      .run(new Date().toISOString(), userId)
  }
}
