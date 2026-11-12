import { describe, expect, it } from 'vitest'
import { DEFAULT_SCHEDULE, endOfDayTime, isWithinSchedule, nextScheduleStart, type Schedule } from '@shared/schedule'

/** 2026-11-09 es lunes. */
const at = (day: number, time: string) => new Date(`2026-11-${String(day).padStart(2, '0')}T${time}:00`)
const ON: Schedule = { ...DEFAULT_SCHEDULE, enabled: true }

describe('horario', () => {
  it('apagado no cuenta nunca', () => {
    expect(isWithinSchedule(DEFAULT_SCHEDULE, at(9, '10:00'))).toBe(false)
  })

  it('lunes a viernes de 08:30 a 18:00: incluye el inicio, excluye el fin', () => {
    expect(isWithinSchedule(ON, at(9, '08:29'))).toBe(false)
    expect(isWithinSchedule(ON, at(9, '08:30'))).toBe(true)
    expect(isWithinSchedule(ON, at(9, '17:59'))).toBe(true)
    expect(isWithinSchedule(ON, at(9, '18:00'))).toBe(false)
  })

  it('el sábado está desmarcado', () => {
    expect(isWithinSchedule(ON, at(14, '10:00'))).toBe(false)
  })

  it('un día con fin anterior al inicio no cuenta', () => {
    const broken: Schedule = { enabled: true, days: ON.days.map((day) => ({ ...day, from: '18:00', to: '08:00' })) }
    expect(isWithinSchedule(broken, at(9, '10:00'))).toBe(false)
    expect(nextScheduleStart(broken, at(9, '10:00'))).toBeNull()
  })

  it('próximo inicio: hoy si todavía no empezó, si no el próximo día marcado', () => {
    expect(nextScheduleStart(ON, at(9, '07:00'))).toEqual({ dayOffset: 0, time: '08:30' })
    expect(nextScheduleStart(ON, at(9, '19:00'))).toEqual({ dayOffset: 1, time: '08:30' })
    // viernes a la noche: el próximo es el lunes
    expect(nextScheduleStart(ON, at(13, '19:00'))).toEqual({ dayOffset: 3, time: '08:30' })
  })

  it('fin del día: el del horario de hoy, o 18:00 si hoy no hay horario', () => {
    const early: Schedule = { enabled: true, days: ON.days.map((day) => ({ ...day, to: '16:00' })) }
    expect(endOfDayTime(early, at(9, '10:00'))).toBe('16:00')
    expect(endOfDayTime(early, at(14, '10:00'))).toBe('18:00')
    expect(endOfDayTime(DEFAULT_SCHEDULE, at(9, '10:00'))).toBe('18:00')
  })
})
