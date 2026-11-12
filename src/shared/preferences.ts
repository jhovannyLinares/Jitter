import { z } from 'zod'
import { DAYS_PER_WEEK, DEFAULT_SCHEDULE } from './schedule'

/** Teams pasa a «Ausente» a los 5 minutos: el máximo deja margen para otras apps con umbrales más largos. */
export const MIN_INTERVAL_MINUTES = 1
export const MAX_INTERVAL_MINUTES = 14
export const DEFAULT_INTERVAL_MINUTES = 4

const TIME = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)
const DayScheduleSchema = z.object({ enabled: z.boolean(), from: TIME, to: TIME })
const ScheduleSchema = z.object({ enabled: z.boolean(), days: z.array(DayScheduleSchema).length(DAYS_PER_WEEK) })

const fields = {
  language: z.enum(['system', 'es', 'en']),
  theme: z.enum(['system', 'light', 'dark']),
  intervalMinutes: z.number().int().min(MIN_INTERVAL_MINUTES).max(MAX_INTERVAL_MINUTES),
  /** f15: una tecla que no existe en el teclado · mouse: mueve el cursor 1 px y lo devuelve */
  method: z.enum(['f15', 'mouse']),
  /** estado al abrir: apagada, el último que tenía, o según el horario */
  startup: z.enum(['off', 'last', 'schedule']),
  startWithWindows: z.boolean(),
  notify: z.boolean(),
  keepInTray: z.boolean(),
  /** encendida al cerrar, para «Como la dejé» */
  lastOn: z.boolean(),
  /** ya vio la bienvenida del primer uso */
  welcomed: z.boolean(),
  schedule: ScheduleSchema
}

export const PreferencesSchema = z.object(fields)
export type Preferences = z.infer<typeof PreferencesSchema>

export const DEFAULT_PREFERENCES: Preferences = {
  language: 'system',
  theme: 'system',
  intervalMinutes: DEFAULT_INTERVAL_MINUTES,
  method: 'f15',
  startup: 'off',
  startWithWindows: false,
  notify: true,
  keepInTray: true,
  lastOn: false,
  welcomed: false,
  schedule: DEFAULT_SCHEDULE
}

/** Lo que la interfaz puede cambiar: cualquier campo, cada uno validado. */
export const PreferencesPatchSchema = PreferencesSchema.partial().strict()
export type PreferencesPatch = z.infer<typeof PreferencesPatchSchema>

export interface ParsedPreferences {
  preferences: Preferences
  /** campos que venían rotos y volvieron a lo de fábrica */
  repaired: string[]
}

/**
 * Lee preferencias que vienen del disco. Un campo roto vuelve a su valor de fábrica sin arrastrar a los demás; un
 * archivo de una versión anterior al que le falta un campo lo completa igual.
 */
export function parsePreferences(raw: unknown): ParsedPreferences {
  const source = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {}
  const repaired: string[] = []
  const preferences = { ...DEFAULT_PREFERENCES } as Record<string, unknown>
  for (const [name, schema] of Object.entries(fields)) {
    if (!(name in source)) continue
    const parsed = schema.safeParse(source[name])
    if (parsed.success) preferences[name] = parsed.data
    else repaired.push(name)
  }
  return { preferences: preferences as Preferences, repaired }
}

export const PREFERENCES_FILE = 'preferences.json'
export const LOG_FILE = 'jitter.log'

/** Carpeta de datos: `JITTER_HOME` la cambia (tests y perfiles de prueba); si no, %APPDATA%\Jitter. */
export function jitterHomePath(env: Record<string, string | undefined>, fallbackRoot: string): string {
  if (env.JITTER_HOME) return env.JITTER_HOME
  const appData = env.APPDATA ?? fallbackRoot
  return `${appData}\\Jitter`
}
