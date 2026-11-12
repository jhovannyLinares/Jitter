/**
 * Eventos de main a la interfaz. Archivo sin dependencias: lo importa el preload, que corre en sandbox y no puede
 * cargar módulos como zod.
 */
export const EVENT_SNAPSHOT = 'jitter:snapshot'
export const EVENT_PREFERENCES = 'jitter:preferences'
export const EVENT_COMMAND = 'jitter:command'
/** Lo que main le pide a la interfaz que muestre (desde la bandeja o un aviso). */
export type InterfaceCommand = 'show-home'
