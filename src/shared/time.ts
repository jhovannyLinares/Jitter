const MS_PER_SECOND = 1000
const SECONDS_PER_MINUTE = 60
const MINUTES_PER_HOUR = 60

/** «HH:MM» de un instante, en la hora local. */
export function clockTime(epochMs: number): string {
  const date = new Date(epochMs)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

/** Cuenta regresiva: «m:ss», o «h:mm:ss» desde una hora. Nunca negativa. */
export function countdown(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / MS_PER_SECOND))
  const seconds = totalSeconds % SECONDS_PER_MINUTE
  const totalMinutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE)
  const minutes = totalMinutes % MINUTES_PER_HOUR
  const hours = Math.floor(totalMinutes / MINUTES_PER_HOUR)
  const secondsText = String(seconds).padStart(2, '0')
  if (hours === 0) return `${minutes}:${secondsText}`
  return `${hours}:${String(minutes).padStart(2, '0')}:${secondsText}`
}

export const minutesBetween = (fromMs: number, toMs: number) => Math.max(0, Math.floor((toMs - fromMs) / (MS_PER_SECOND * SECONDS_PER_MINUTE)))
