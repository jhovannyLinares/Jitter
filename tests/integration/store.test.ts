import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { loadPreferences, savePreferences } from '../../src/main/store'
import type { Logger } from '../../src/main/log'
import { DEFAULT_PREFERENCES, PREFERENCES_FILE } from '@shared/preferences'

/** Preferencias en disco: lo que viene del disco puede venir roto y no tumba la app. */
function capture() {
  const warnings: { operation: string; fields?: Record<string, unknown> }[] = []
  const log: Logger = { debug: () => {}, info: () => {}, error: () => {}, warn: (operation, fields) => warnings.push({ operation, fields }) }
  return { log, warnings }
}
const freshDir = () => mkdtempSync(join(tmpdir(), 'jitter-store-'))

describe('preferencias en disco', () => {
  it('sin archivo: las de fábrica, sin aviso', () => {
    const { log, warnings } = capture()
    expect(loadPreferences(freshDir(), log)).toEqual(DEFAULT_PREFERENCES)
    expect(warnings).toHaveLength(0)
  })

  it('guardar y volver a leer devuelve lo mismo', () => {
    const dir = freshDir()
    const { log } = capture()
    const changed = { ...DEFAULT_PREFERENCES, intervalMinutes: 2, method: 'mouse' as const, welcomed: true }
    savePreferences(dir, changed)
    expect(loadPreferences(dir, log)).toEqual(changed)
  })

  it('archivo lleno de ceros: las de fábrica y un aviso que nombra el archivo', () => {
    const dir = freshDir()
    writeFileSync(join(dir, PREFERENCES_FILE), Buffer.alloc(64))
    const { log, warnings } = capture()
    expect(loadPreferences(dir, log)).toEqual(DEFAULT_PREFERENCES)
    expect(warnings[0]?.operation).toBe('preferences.unreadable')
    expect(String(warnings[0]?.fields?.file)).toContain(PREFERENCES_FILE)
  })

  it('archivo cortado a la mitad: las de fábrica', () => {
    const dir = freshDir()
    savePreferences(dir, { ...DEFAULT_PREFERENCES, intervalMinutes: 3 })
    const file = join(dir, PREFERENCES_FILE)
    writeFileSync(file, readFileSync(file, 'utf8').slice(0, 40))
    const { log, warnings } = capture()
    expect(loadPreferences(dir, log)).toEqual(DEFAULT_PREFERENCES)
    expect(warnings).toHaveLength(1)
  })

  it('un campo roto vuelve a su valor de fábrica y el resto se conserva', () => {
    const dir = freshDir()
    writeFileSync(join(dir, PREFERENCES_FILE), JSON.stringify({ ...DEFAULT_PREFERENCES, intervalMinutes: 99, method: 'mouse', schedule: { enabled: true, days: [] } }))
    const { log, warnings } = capture()
    const loaded = loadPreferences(dir, log)
    expect(loaded.intervalMinutes).toBe(DEFAULT_PREFERENCES.intervalMinutes)
    expect(loaded.schedule).toEqual(DEFAULT_PREFERENCES.schedule)
    expect(loaded.method).toBe('mouse')
    expect(warnings[0]?.fields?.fields).toEqual(['intervalMinutes', 'schedule'])
  })

  it('un archivo de una versión anterior, sin campos nuevos, se completa con los de fábrica', () => {
    const dir = freshDir()
    writeFileSync(join(dir, PREFERENCES_FILE), JSON.stringify({ theme: 'dark' }))
    const { log, warnings } = capture()
    expect(loadPreferences(dir, log)).toEqual({ ...DEFAULT_PREFERENCES, theme: 'dark' })
    expect(warnings).toHaveLength(0)
  })
})
