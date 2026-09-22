import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3333),
  DATABASE_FILE: z.string().default('./data/organizacion.db'),
  JWT_SECRET: z.string().min(32),
  JWT_ISSUER: z.string().default('organizacion-api'),
  JWT_AUDIENCE: z.string().default('organizacion-web'),
  ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().int().positive().default(60),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),
  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(12),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  SEED_ADMIN_EMAIL: z.email().default('admin@organizacion.dev'),
  SEED_ADMIN_PASSWORD: z.string().min(8).default('Admin@12345'),
  LOGIN_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(5),
  LOGIN_RATE_LIMIT_WINDOW_MINUTES: z.coerce
    .number()
    .int()
    .positive()
    .default(15)
})

const DEV_FALLBACK_SECRET =
  'development-only-secret-change-me-in-production-32chars'

const source = {
  ...process.env,
  JWT_SECRET:
    process.env.JWT_SECRET ??
    (process.env.NODE_ENV === 'production' ? undefined : DEV_FALLBACK_SECRET)
}

const parsed = envSchema.safeParse(source)

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n')
  throw new Error(`Variaveis de ambiente invalidas:\n${details}`)
}

export const env = {
  ...parsed.data,
  corsOrigins: parsed.data.CORS_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  accessTokenTtlSeconds: parsed.data.ACCESS_TOKEN_TTL_MINUTES * 60,
  refreshTokenTtlSeconds: parsed.data.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60,
  isProduction: parsed.data.NODE_ENV === 'production',
  isTest: parsed.data.NODE_ENV === 'test'
}

export type Env = typeof env
