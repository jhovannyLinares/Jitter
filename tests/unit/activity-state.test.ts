import { describe, expect, it } from 'vitest'
import { initialState, recordPulse, setLocked, statusKind, tick, turnOff, turnOn } from '@shared/activity-state'
import { DEFAULT_SCHEDULE } from '@shared/schedule'

const MINUTE = 60_000
const INTERVAL = 4 * MINUTE
const T0 = new Date('2026-11-09T10:00:00').getTime()

describe('estado del simulador', () => {
  it('encendida sin tiempo: la primera señal llega a los N minutos, no antes', () => {
    const on = turnOn(initialState(T0), 'forever', T0, INTERVAL, DEFAULT_SCHEDULE)
    expect(on.endsAt).toBeNull()
    expect(tick(on, T0 + INTERVAL - 1, INTERVAL).pulse).toBe(false)
    const due = tick(on, T0 + INTERVAL, INTERVAL)
    expect(due.pulse).toBe(true)
    expect(due.state.nextPulseAt).toBe(T0 + 2 * INTERVAL)
  })

  it('con 30 min se apaga sola al vencer y lo informa', () => {
    const on = turnOn(initialState(T0), '30', T0, INTERVAL, DEFAULT_SCHEDULE)
    expect(on.endsAt).toBe(T0 + 30 * MINUTE)
    const result = tick(on, T0 + 30 * MINUTE, INTERVAL)
    expect(result.expired).toBe(true)
    expect(result.state.on).toBe(false)
  })

  it('«Hasta las 18:00» ya pasada queda como hasta apagarla', () => {
    const evening = new Date('2026-11-09T19:00:00').getTime()
    const on = turnOn(initialState(evening), 'endOfDay', evening, INTERVAL, DEFAULT_SCHEDULE)
    expect(on.untilChoice).toBe('forever')
    expect(on.endsAt).toBeNull()
  })

  it('cambiar el tiempo estando encendida no corre la próxima señal', () => {
    const on = turnOn(initialState(T0), 'forever', T0, INTERVAL, DEFAULT_SCHEDULE)
    const later = turnOn(on, '60', T0 + MINUTE, INTERVAL, DEFAULT_SCHEDULE)
    expect(later.nextPulseAt).toBe(on.nextPulseAt)
    expect(later.onSince).toBe(T0)
    expect(later.endsAt).toBe(T0 + MINUTE + 60 * MINUTE)
  })

  it('con la pantalla bloqueada no hay señales; al desbloquear cuenta desde ahí', () => {
    const on = turnOn(initialState(T0), 'forever', T0, INTERVAL, DEFAULT_SCHEDULE)
    const locked = setLocked(on, true, T0 + MINUTE, INTERVAL)
    expect(tick(locked, T0 + 10 * MINUTE, INTERVAL).pulse).toBe(false)
    const unlocked = setLocked(locked, false, T0 + 10 * MINUTE, INTERVAL)
    expect(unlocked.nextPulseAt).toBe(T0 + 10 * MINUTE + INTERVAL)
  })

  it('el conteo de señales vuelve a cero al cambiar de día', () => {
    const counted = recordPulse(recordPulse(initialState(T0), true), true)
    expect(counted.pulsesToday).toBe(2)
    const tomorrow = T0 + 24 * 60 * MINUTE
    expect(tick(counted, tomorrow, INTERVAL).state.pulsesToday).toBe(0)
  })

  it('una señal rechazada marca el error y no suma', () => {
    const on = turnOn(initialState(T0), 'forever', T0, INTERVAL, DEFAULT_SCHEDULE)
    const failed = recordPulse(on, false)
    expect(failed.failed).toBe(true)
    expect(failed.pulsesToday).toBe(0)
    expect(statusKind(failed, false)).toBe('err')
  })

  it('cada estado tiene su forma', () => {
    const off = initialState(T0)
    const on = turnOn(off, 'forever', T0, INTERVAL, DEFAULT_SCHEDULE)
    expect(statusKind(off, false)).toBe('off')
    expect(statusKind(off, true)).toBe('wait')
    expect(statusKind(on, false)).toBe('on')
    expect(statusKind(setLocked(on, true, T0, INTERVAL), false)).toBe('paused')
    expect(statusKind(turnOff(on), false)).toBe('off')
  })
})
