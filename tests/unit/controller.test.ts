import { describe, expect, it } from 'vitest'
import { ActivityController, type ControllerDeps } from '../../src/main/controller'
import type { Logger } from '../../src/main/log'
import { DEFAULT_PREFERENCES, type Preferences } from '@shared/preferences'

const MINUTE = 60_000
const silentLog: Logger = { debug: () => {}, info: () => {}, warn: () => {}, error: () => {} }

/** Un controlador con reloj y señal falsos: el reloj lo mueve el test, la señal se cuenta. */
function setup(preferences: Partial<Preferences> = {}, start = '2026-11-09T10:00:00', accept = true) {
  const clock = { now: new Date(start).getTime() }
  const pulses: string[] = []
  const notices: string[] = []
  const warnings: string[] = []
  const deps: ControllerDeps = {
    now: () => clock.now,
    sendPulse: (method) => (pulses.push(method), accept),
    notify: (title) => notices.push(title),
    onChange: () => {},
    log: { ...silentLog, warn: (operation) => warnings.push(operation) }
  }
  const controller = new ActivityController({ ...DEFAULT_PREFERENCES, ...preferences }, deps)
  const advance = (minutes: number) => {
    for (let second = 0; second < minutes * 60; second++) {
      clock.now += 1000
      controller.tick()
    }
  }
  return { controller, pulses, notices, warnings, advance }
}

describe('controlador', () => {
  it('encendida, envía una señal por intervalo con el método elegido', () => {
    const { controller, pulses, advance } = setup({ intervalMinutes: 2, method: 'mouse' })
    controller.turnOn('forever', 'button')
    advance(6)
    expect(pulses).toEqual(['mouse', 'mouse', 'mouse'])
    expect(controller.snapshot().state.pulsesToday).toBe(3)
  })

  it('apagada no envía nada', () => {
    const { pulses, advance } = setup()
    advance(10)
    expect(pulses).toHaveLength(0)
  })

  it('con 30 min se apaga sola y avisa', () => {
    const { controller, notices, advance } = setup()
    controller.turnOn('30', 'button')
    advance(30)
    expect(controller.current.on).toBe(false)
    expect(notices).toEqual(['notify.expiredTitle'])
  })

  it('sin avisos activados, se apaga igual pero no avisa', () => {
    const { controller, notices, advance } = setup({ notify: false })
    controller.turnOn('30', 'button')
    advance(30)
    expect(controller.current.on).toBe(false)
    expect(notices).toHaveLength(0)
  })

  it('el horario la enciende al cruzar el inicio y la apaga al cruzar el fin', () => {
    const schedule = { ...DEFAULT_PREFERENCES.schedule, enabled: true }
    const { controller, notices, advance } = setup({ schedule }, '2026-11-09T08:28:00')
    controller.start()
    expect(controller.snapshot().scheduleWaiting).toBe(true)
    advance(3)
    expect(controller.current.on).toBe(true)
    advance(9 * 60 + 30)
    expect(controller.current.on).toBe(false)
    expect(notices).toEqual(['notify.scheduleOnTitle', 'notify.scheduleOffTitle'])
  })

  it('dentro del horario, apagarla a mano gana hasta el próximo borde', () => {
    const schedule = { ...DEFAULT_PREFERENCES.schedule, enabled: true }
    const { controller, advance } = setup({ schedule, startup: 'schedule' })
    controller.start()
    expect(controller.current.on).toBe(true)
    controller.turnOff('button')
    advance(30)
    expect(controller.current.on).toBe(false)
  })

  it('al abrir: «Como la dejé» respeta la última vez y «Apagada» no', () => {
    const last = setup({ startup: 'last', lastOn: true })
    last.controller.start()
    expect(last.controller.current.on).toBe(true)
    const off = setup({ startup: 'off', lastOn: true })
    off.controller.start()
    expect(off.controller.current.on).toBe(false)
  })

  it('el atajo avisa al encender y al apagar', () => {
    const { controller, notices } = setup()
    controller.toggle('shortcut')
    controller.toggle('shortcut')
    expect(notices).toEqual(['notify.shortcutOnTitle', 'notify.shortcutOffTitle'])
  })

  it('una señal rechazada se registra una vez, no en cada intento', () => {
    const { controller, warnings, advance } = setup({ intervalMinutes: 1 }, '2026-11-09T10:00:00', false)
    controller.turnOn('forever', 'button')
    advance(5)
    expect(controller.snapshot().state.failed).toBe(true)
    expect(warnings).toEqual(['pulse.rejected'])
  })

  it('cambiar el intervalo cuenta desde ahora', () => {
    const { controller, pulses, advance } = setup({ intervalMinutes: 10 })
    controller.turnOn('forever', 'button')
    advance(3)
    controller.setPreferences({ ...DEFAULT_PREFERENCES, intervalMinutes: 1 })
    advance(1)
    expect(pulses).toHaveLength(1)
  })

  it('con la pantalla bloqueada no envía señales', () => {
    const { controller, pulses, advance } = setup({ intervalMinutes: 1 })
    controller.turnOn('forever', 'button')
    controller.setLocked(true)
    advance(5)
    expect(pulses).toHaveLength(0)
    controller.setLocked(false)
    advance(1)
    expect(pulses).toHaveLength(1)
  })
})

describe('reloj del controlador', () => {
  it('el minuto exacto del intervalo dispara la señal', () => {
    const { controller, pulses, advance } = setup({ intervalMinutes: 4 })
    controller.turnOn('forever', 'button')
    advance(4)
    expect(pulses).toHaveLength(1)
    expect(controller.current.nextPulseAt! - Date.parse('2026-11-09T10:04:00')).toBe(4 * MINUTE)
  })
})
