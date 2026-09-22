import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { env } from '../config/env.js'

let connection: DatabaseSync | null = null

const MIGRATION = `
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'OPERATOR', 'CLIENT')),
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS refresh_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    revoked_at TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens (user_id);
`

const resolveLocation = (): string => {
  if (env.isTest) return ':memory:'
  if (env.DATABASE_FILE === ':memory:') return ':memory:'
  mkdirSync(dirname(env.DATABASE_FILE), { recursive: true })
  return env.DATABASE_FILE
}

export const getDatabase = (): DatabaseSync => {
  if (!connection) {
    connection = new DatabaseSync(resolveLocation())
    connection.exec(MIGRATION)
  }
  return connection
}

export const closeDatabase = (): void => {
  connection?.close()
  connection = null
}

export const resetDatabase = (): void => {
  const db = getDatabase()
  db.exec('DELETE FROM refresh_tokens; DELETE FROM users;')
}
