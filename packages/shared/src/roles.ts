export const ROLES = ['ADMIN', 'OPERATOR', 'CLIENT'] as const

export type Role = (typeof ROLES)[number]

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrador',
  OPERATOR: 'Operador',
  CLIENT: 'Cliente'
}

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  ADMIN: 'Acesso total: cria, consulta, atualiza e exclui qualquer usuario.',
  OPERATOR: 'Acesso intermediario: consulta todos e atualiza dados cadastrais.',
  CLIENT: 'Acesso restrito: visualiza e edita apenas o proprio cadastro.'
}

export const ROLE_RANK: Record<Role, number> = {
  ADMIN: 3,
  OPERATOR: 2,
  CLIENT: 1
}

export const isRole = (value: unknown): value is Role =>
  typeof value === 'string' && (ROLES as readonly string[]).includes(value)
