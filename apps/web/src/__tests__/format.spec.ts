import { describe, expect, it } from 'vitest'
import { classNames, formatDateTime, initialsOf } from '@/lib/format'

describe('utilitarios de formatacao', () => {
  it('monta iniciais com no maximo duas letras', () => {
    expect(initialsOf('Ana Souza')).toBe('AS')
    expect(initialsOf('Maria da Silva Prado')).toBe('MD')
    expect(initialsOf('joao')).toBe('J')
  })

  it('formata data e hora no padrao brasileiro', () => {
    expect(formatDateTime('2026-01-10T12:00:00.000Z')).toMatch(
      /\d{2}\/\d{2}\/\d{4}/
    )
  })

  it('concatena apenas classes verdadeiras', () => {
    expect(classNames('a', false, null, undefined, 'b')).toBe('a b')
  })
})
