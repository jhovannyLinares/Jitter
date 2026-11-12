import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { DEFAULT_PREFERENCES, parsePreferences, PREFERENCES_FILE, type Preferences } from '@shared/preferences'
import type { Logger } from './log'

/**
 * Preferencias en disco (%APPDATA%\Jitter\preferences.json). Lo que viene del disco no es confiable: un archivo
 * ilegible vuelve a lo de fábrica y un campo roto vuelve a su valor de fábrica, con un aviso en el registro.
 */
export function loadPreferences(dataDir: string, log: Logger): Preferences {
  const file = join(dataDir, PREFERENCES_FILE)
  if (!existsSync(file)) return DEFAULT_PREFERENCES
  let raw: unknown
  try {
    raw = JSON.parse(readFileSync(file, 'utf8'))
  } catch (error) {
    log.warn('preferences.unreadable', { file, error: String(error), action: 'se usan las de fábrica' })
    return DEFAULT_PREFERENCES
  }
  const { preferences, repaired } = parsePreferences(raw)
  if (repaired.length > 0) log.warn('preferences.repaired', { file, fields: repaired, action: 'vuelven a su valor de fábrica' })
  return preferences
}

/** Escribe en un temporal y lo reemplaza: un corte a mitad no deja el archivo a medias. */
export function savePreferences(dataDir: string, preferences: Preferences): void {
  mkdirSync(dataDir, { recursive: true })
  const file = join(dataDir, PREFERENCES_FILE)
  const temporary = `${file}.tmp`
  writeFileSync(temporary, JSON.stringify(preferences, null, 2), 'utf8')
  renameSync(temporary, file)
}
