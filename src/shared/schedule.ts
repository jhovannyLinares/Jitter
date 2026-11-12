/** Horario semanal: qué días y entre qué horas Jitter se enciende sola. El índice 0 es el lunes. */
export interface DaySchedule {
  enabled: boolean
  /** «HH:MM» en 24 h */
  from: string
  to: string
}
export interface Schedule {
  enabled: boolean
  days: DaySchedule[]
}

export const DAYS_PER_WEEK = 7
const MINUTES_PER_HOUR = 60
/** Fin del día cuando no hay horario para hoy: la opción «Hasta las 18:00». */
export const DEFAULT_END_OF_DAY = '18:00'
const WORKDAY = { from: '08:30', to: '18:00' }
const WEEKDAYS = 5

export const DEFAULT_SCHEDULE: Schedule = {
  enabled: false,
  days: Array.from({ length: DAYS_PER_WEEK }, (_, index) => ({ enabled: index < WEEKDAYS, ...WORKDAY }))
}

/** Minutos desde la medianoche de «HH:MM». */
export function minutesOf(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return (hours ?? 0) * MINUTES_PER_HOUR + (minutes ?? 0)
}

/** Lunes = 0 … domingo = 6 (Date.getDay() empieza en domingo). */
export const weekdayIndex = (date: Date) => (date.getDay() + 6) % DAYS_PER_WEEK

const minutesOfDay = (date: Date) => date.getHours() * MINUTES_PER_HOUR + date.getMinutes()

/** Un día solo cuenta si su hora de fin es posterior a la de inicio. */
export const dayIsValid = (day: DaySchedule) => minutesOf(day.to) > minutesOf(day.from)

export function isWithinSchedule(schedule: Schedule, date: Date): boolean {
  if (!schedule.enabled) return false
  const today = schedule.days[weekdayIndex(date)]
  if (!today?.enabled || !dayIsValid(today)) return false
  const now = minutesOfDay(date)
  return now >= minutesOf(today.from) && now < minutesOf(today.to)
}

/** Próximo inicio del horario a partir de `date`: en cuántos días y a qué hora. Null si no hay ningún día activo. */
export function nextScheduleStart(schedule: Schedule, date: Date): { dayOffset: number; time: string } | null {
  if (!schedule.enabled) return null
  const now = minutesOfDay(date)
  for (let dayOffset = 0; dayOffset <= DAYS_PER_WEEK; dayOffset++) {
    const day = schedule.days[(weekdayIndex(date) + dayOffset) % DAYS_PER_WEEK]
    if (!day?.enabled || !dayIsValid(day)) continue
    const startsLaterToday = dayOffset > 0 || minutesOf(day.from) > now
    if (startsLaterToday) return { dayOffset, time: day.from }
  }
  return null
}

/** Hora de fin de hoy: la del horario si hoy tiene uno válido, si no la de fábrica. */
export function endOfDayTime(schedule: Schedule, date: Date): string {
  const today = schedule.days[weekdayIndex(date)]
  const scheduledToday = schedule.enabled && today?.enabled && dayIsValid(today)
  return scheduledToday ? today.to : DEFAULT_END_OF_DAY
}

/** El instante de hoy a esa hora, en milisegundos. */
export function todayAt(date: Date, time: string): number {
  const result = new Date(date)
  result.setHours(0, minutesOf(time), 0, 0)
  return result.getTime()
}
