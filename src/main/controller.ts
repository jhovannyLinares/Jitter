import {
  changeInterval, endOfDayAvailable, initialState, recordPulse, setLocked, tick, turnOff, turnOn,
  type ActivityState, type Snapshot, type UntilChoice
} from '@shared/activity-state'
import type { TextKey } from '@shared/i18n'
import type { Preferences } from '@shared/preferences'
import { endOfDayTime, isWithinSchedule, nextScheduleStart } from '@shared/schedule'
import { clockTime } from '@shared/time'
import type { PulseMethod } from './input'
import type { Logger } from './log'

const MS_PER_MINUTE = 60_000

/** Quién pidió el cambio: queda en el registro y decide si hay aviso. */
export type Source = 'button' | 'tray' | 'shortcut' | 'schedule' | 'startup'

export interface ControllerDeps {
  now: () => number
  sendPulse: (method: PulseMethod) => boolean
  notify: (title: TextKey, body: TextKey, values?: Record<string, string | number>) => void
  onChange: (snapshot: Snapshot) => void
  log: Logger
}

/**
 * Dueño del estado del simulador. Main lo avanza con `tick()` cada segundo; la interfaz, la bandeja y el atajo lo
 * cambian con turnOn / turnOff. No sabe de Electron: así se prueba con un reloj y una señal falsos.
 */
export class ActivityController {
  private state: ActivityState
  /** dentro del horario en el último tick; null = todavía no se evaluó */
  private lastWithin: boolean | null = null
  shortcutActive = false

  constructor(private preferences: Preferences, private readonly deps: ControllerDeps) {
    this.state = initialState(deps.now())
  }

  private get intervalMs() {
    return this.preferences.intervalMinutes * MS_PER_MINUTE
  }

  private within(): boolean {
    return isWithinSchedule(this.preferences.schedule, new Date(this.deps.now()))
  }

  snapshot(): Snapshot {
    const now = this.deps.now()
    const date = new Date(now)
    const schedule = this.preferences.schedule
    return {
      state: this.state,
      scheduleWaiting: schedule.enabled && !this.state.on && !this.within(),
      nextStart: nextScheduleStart(schedule, date),
      endOfDay: { time: endOfDayTime(schedule, date), available: endOfDayAvailable(now, schedule) },
      shortcutActive: this.shortcutActive
    }
  }

  private changed(): void {
    this.deps.onChange(this.snapshot())
  }

  /** Estado al abrir, según Configuración. */
  start(): void {
    const startup = this.preferences.startup
    const startsOn = (startup === 'last' && this.preferences.lastOn) || (startup === 'schedule' && this.within())
    this.lastWithin = this.preferences.schedule.enabled ? this.within() : null
    if (startsOn) this.turnOn('forever', 'startup')
    else this.changed()
  }

  turnOn(choice: UntilChoice, source: Source): void {
    this.state = turnOn(this.state, choice, this.deps.now(), this.intervalMs, this.preferences.schedule)
    this.deps.log.info('power.on', { source, until: this.state.untilChoice })
    if (source === 'shortcut') this.notifyIfWanted('notify.shortcutOnTitle', 'notify.shortcutOnBody', { minutes: this.preferences.intervalMinutes })
    this.changed()
  }

  turnOff(source: Source): void {
    if (!this.state.on) return this.changed()
    this.state = turnOff(this.state)
    this.deps.log.info('power.off', { source })
    if (source === 'shortcut') this.notifyIfWanted('notify.shortcutOffTitle', 'notify.shortcutOffBody')
    this.changed()
  }

  toggle(source: Source): void {
    if (this.state.on) this.turnOff(source)
    else this.turnOn('forever', source)
  }

  setLocked(locked: boolean): void {
    if (locked === this.state.locked) return
    this.state = setLocked(this.state, locked, this.deps.now(), this.intervalMs)
    this.deps.log.info(locked ? 'session.lock' : 'session.unlock', { on: this.state.on })
    this.changed()
  }

  setPreferences(next: Preferences): void {
    const previous = this.preferences
    this.preferences = next
    if (next.intervalMinutes !== previous.intervalMinutes) this.state = changeInterval(this.state, this.deps.now(), this.intervalMs)
    const scheduleTurnedOn = next.schedule.enabled && !previous.schedule.enabled
    // al activar el horario se alinea en el momento: encendida si está dentro, apagada si está fuera
    if (scheduleTurnedOn) this.followSchedule(this.within())
    if (!next.schedule.enabled) this.lastWithin = null
    this.changed()
  }

  private followSchedule(within: boolean): void {
    this.lastWithin = within
    const time = clockTime(this.deps.now())
    if (within && !this.state.on) {
      this.turnOn('forever', 'schedule')
      this.notifyIfWanted('notify.scheduleOnTitle', 'notify.scheduleOnBody', { time })
    }
    if (!within && this.state.on) {
      this.turnOff('schedule')
      this.notifyIfWanted('notify.scheduleOffTitle', 'notify.scheduleOffBody', { time })
    }
  }

  /** Un segundo más: horario, vencimiento y señal. Solo avisa a la interfaz si algo cambió de verdad. */
  tick(): void {
    if (this.preferences.schedule.enabled) {
      const within = this.within()
      // solo los cruces de borde mandan: en medio, el botón gana hasta el próximo borde
      if (this.lastWithin !== null && within !== this.lastWithin) this.followSchedule(within)
      this.lastWithin = within
    }
    const before = this.state
    const result = tick(this.state, this.deps.now(), this.intervalMs)
    this.state = result.state
    if (result.expired) {
      this.deps.log.info('power.off', { source: 'timer' })
      this.notifyIfWanted('notify.expiredTitle', 'notify.expiredBody')
    }
    if (result.pulse) this.pulse()
    const visibleChange = result.expired || result.pulse || before.pulsesDay !== this.state.pulsesDay
    if (visibleChange) this.changed()
  }

  private pulse(): void {
    const method = this.preferences.method
    const accepted = this.deps.sendPulse(method)
    const wasFailing = this.state.failed
    this.state = recordPulse(this.state, accepted)
    if (accepted) this.deps.log.debug('pulse', { method })
    // un fallo se registra al empezar, no en cada señal que sigue fallando
    if (!accepted && !wasFailing) this.deps.log.warn('pulse.rejected', { method, action: 'se reintenta en la próxima señal' })
    if (accepted && wasFailing) this.deps.log.info('pulse.recovered', { method })
  }

  private notifyIfWanted(title: TextKey, body: TextKey, values: Record<string, string | number> = {}): void {
    if (this.preferences.notify) this.deps.notify(title, body, values)
  }

  get current(): ActivityState {
    return this.state
  }
}
