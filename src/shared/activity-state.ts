import { endOfDayTime, todayAt, type Schedule } from './schedule'

/** Hasta cuándo queda encendida: hasta apagarla, unos minutos, o hasta el fin del día. */
export const UNTIL_CHOICES = ['forever', '30', '60', '120', 'endOfDay'] as const
export type UntilChoice = (typeof UNTIL_CHOICES)[number]

const MS_PER_MINUTE = 60_000

/** Estado del simulador. Lo decide main; la interfaz y la bandeja lo muestran. Los instantes van en ms epoch. */
export interface ActivityState {
  on: boolean
  untilChoice: UntilChoice
  endsAt: number | null
  nextPulseAt: number | null
  onSince: number | null
  locked: boolean
  failed: boolean
  pulsesToday: number
  /** «AAAA-MM-DD» del día que cuenta `pulsesToday` */
  pulsesDay: string
}

export const dayKey = (now: number) => {
  const date = new Date(now)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export const initialState = (now: number): ActivityState => ({
  on: false, untilChoice: 'forever', endsAt: null, nextPulseAt: null, onSince: null, locked: false, failed: false, pulsesToday: 0, pulsesDay: dayKey(now)
})

/** Cuándo se apaga según la opción elegida. Null = hasta apagarla. */
export function endsAtFor(choice: UntilChoice, now: number, schedule: Schedule): number | null {
  if (choice === 'forever') return null
  if (choice === 'endOfDay') return todayAt(new Date(now), endOfDayTime(schedule, new Date(now)))
  return now + Number(choice) * MS_PER_MINUTE
}

/** «Hasta las 18:00» solo se ofrece si esa hora todavía no pasó. */
export const endOfDayAvailable = (now: number, schedule: Schedule) => (endsAtFor('endOfDay', now, schedule) ?? 0) > now

export function turnOn(state: ActivityState, choice: UntilChoice, now: number, intervalMs: number, schedule: Schedule): ActivityState {
  const endsAt = endsAtFor(choice, now, schedule)
  const alreadyOver = endsAt !== null && endsAt <= now
  const effectiveChoice = alreadyOver ? 'forever' : choice
  return {
    ...state,
    on: true,
    untilChoice: effectiveChoice,
    endsAt: alreadyOver ? null : endsAt,
    nextPulseAt: state.on && state.nextPulseAt ? state.nextPulseAt : now + intervalMs,
    onSince: state.on ? state.onSince : now,
    failed: false
  }
}

export const turnOff = (state: ActivityState): ActivityState => ({ ...state, on: false, untilChoice: 'forever', endsAt: null, nextPulseAt: null, onSince: null, failed: false })

/** Al desbloquear la pantalla la próxima señal se cuenta desde ahí: durante el bloqueo no se envió nada. */
export function setLocked(state: ActivityState, locked: boolean, now: number, intervalMs: number): ActivityState {
  const resumes = !locked && state.locked && state.on
  return { ...state, locked, nextPulseAt: resumes ? now + intervalMs : state.nextPulseAt }
}

/** Un cambio de intervalo cuenta desde ahora, para no esperar el intervalo viejo. */
export const changeInterval = (state: ActivityState, now: number, intervalMs: number): ActivityState => (state.on ? { ...state, nextPulseAt: now + intervalMs } : state)

export interface TickResult {
  state: ActivityState
  /** toca enviar una señal ahora */
  pulse: boolean
  /** se terminó el tiempo elegido y se apagó */
  expired: boolean
}

/** Avanza el reloj: reinicia el conteo del día, apaga si venció el tiempo y dice si toca una señal. */
export function tick(state: ActivityState, now: number, intervalMs: number): TickResult {
  const today = dayKey(now)
  const counted = today === state.pulsesDay ? state : { ...state, pulsesToday: 0, pulsesDay: today }
  if (!counted.on) return { state: counted, pulse: false, expired: false }
  if (counted.endsAt !== null && now >= counted.endsAt) return { state: turnOff(counted), pulse: false, expired: true }
  if (counted.locked || counted.nextPulseAt === null || now < counted.nextPulseAt) return { state: counted, pulse: false, expired: false }
  return { state: { ...counted, nextPulseAt: now + intervalMs }, pulse: true, expired: false }
}

export function recordPulse(state: ActivityState, accepted: boolean): ActivityState {
  return { ...state, failed: !accepted, pulsesToday: accepted ? state.pulsesToday + 1 : state.pulsesToday }
}

/** Lo que se ve: un estado por forma, color y texto (lámina 5 de la maqueta). */
export type StatusKind = 'on' | 'off' | 'wait' | 'paused' | 'err'

export function statusKind(state: ActivityState, scheduleWaiting: boolean): StatusKind {
  if (state.on && state.failed) return 'err'
  if (state.on && state.locked) return 'paused'
  if (state.on) return 'on'
  if (scheduleWaiting) return 'wait'
  return 'off'
}

/** Lo que main manda a la interfaz en cada cambio. */
export interface Snapshot {
  state: ActivityState
  /** horario activo y fuera de rango, apagada: se encenderá sola */
  scheduleWaiting: boolean
  nextStart: { dayOffset: number; time: string } | null
  /** la hora de «Hasta las …» y si todavía se puede elegir */
  endOfDay: { time: string; available: boolean }
  /** el atajo global quedó registrado (otro programa puede tenerlo tomado) */
  shortcutActive: boolean
}
