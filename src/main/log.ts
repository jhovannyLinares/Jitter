import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname } from 'node:path'

/**
 * Registro de Jitter: una línea JSON por evento en logs\jitter.log. Niveles: ERROR falló y hay que actuar, WARN se
 * degradó pero siguió, INFO hitos (encendida, apagada, horario), DEBUG cada señal (apagado salvo JITTER_DEBUG=1).
 * No guarda datos personales: solo qué pasó, por qué vía y cuándo.
 */
export type Level = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'
type Write = (operation: string, fields?: Record<string, unknown>) => void
export interface Logger {
  debug: Write
  info: Write
  warn: Write
  error: Write
}

export function createLogger(file: string, debugEnabled: boolean): Logger {
  let writeFailed = false
  const write = (level: Level) => (operation: string, fields: Record<string, unknown> = {}) => {
    if (level === 'DEBUG' && !debugEnabled) return
    const line = JSON.stringify({ t: new Date().toISOString(), lvl: level, op: operation, ...fields })
    try {
      mkdirSync(dirname(file), { recursive: true })
      appendFileSync(file, line + '\n', 'utf8')
    } catch (error) {
      // sin registro la app sigue: se avisa una sola vez por consola, no en cada línea
      if (!writeFailed) console.error(`No se pudo escribir el registro en ${file}:`, error)
      writeFailed = true
    }
  }
  return { debug: write('DEBUG'), info: write('INFO'), warn: write('WARN'), error: write('ERROR') }
}

/** Las últimas líneas del registro, para Ayuda → Registro. Sin archivo todavía, ninguna. */
export function readLogTail(file: string, maxLines: number): string[] {
  if (!existsSync(file)) return []
  const lines = readFileSync(file, 'utf8').split(/\r?\n/).filter((line) => line.trim() !== '')
  return lines.slice(-maxLines)
}
