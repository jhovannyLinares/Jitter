import { z } from 'zod'
import { UNTIL_CHOICES } from './activity-state'

/** Contratos de lo que la interfaz le pide a main. Main valida cada carga con estos esquemas antes de usarla. */
export const UntilSchema = z.enum(UNTIL_CHOICES)
/** Solo estas dos rutas se abren desde la interfaz: la carpeta de datos y el registro. */
export const OpenTargetSchema = z.enum(['data', 'log'])
export type OpenTarget = z.infer<typeof OpenTargetSchema>

export interface AboutInfo {
  version: string
  electron: string
  chrome: string
  node: string
  windows: string
  notifications: boolean
  dataDir: string
  logFile: string
}
