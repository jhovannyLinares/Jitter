import { statusKind, type Snapshot, type StatusKind } from '@shared/activity-state'
import type { Preferences } from '@shared/preferences'
import { clockTime, countdown } from '@shared/time'
import type { Translate } from './text'

export interface StatusText {
  kind: StatusKind
  label: string
  badge: string
  /** clase de la insignia de la familia: forma + tinte + texto */
  badgeTone: '' | 'ok' | 'warn' | 'err'
  hint: string
}

const BADGE_TONE: Record<StatusKind, StatusText['badgeTone']> = { on: 'ok', paused: 'warn', err: 'err', off: '', wait: '' }

function whenText(dayOffset: number, t: Translate): string {
  if (dayOffset === 0) return t('when.today')
  if (dayOffset === 1) return t('when.tomorrow')
  return t('when.inDays', { days: dayOffset })
}

export const methodInline = (preferences: Preferences, t: Translate) => (preferences.method === 'f15' ? t('method.f15Inline') : t('method.mouseInline'))

function timerText(snapshot: Snapshot, now: number, t: Translate): string {
  const { untilChoice, endsAt } = snapshot.state
  if (endsAt === null) return t('timer.forever')
  if (untilChoice === 'endOfDay') return t('timer.until', { time: clockTime(endsAt) })
  return t('timer.left', { time: countdown(endsAt - now) })
}

/** Lo que dicen el botón, la insignia y la ayuda debajo, según el estado (lámina 5 de la maqueta). */
export function statusText(snapshot: Snapshot, preferences: Preferences, now: number, t: Translate): StatusText {
  const kind = statusKind(snapshot.state, snapshot.scheduleWaiting)
  const base = { kind, label: t(`state.${kind}`), badgeTone: BADGE_TONE[kind] }
  switch (kind) {
    case 'on':
      return {
        ...base,
        badge: t('badge.on', { time: countdown((snapshot.state.nextPulseAt ?? now) - now) }),
        hint: t('hint.on', { minutes: preferences.intervalMinutes, method: methodInline(preferences, t), timer: timerText(snapshot, now, t) })
      }
    case 'wait': {
      const next = snapshot.nextStart
      const badge = next ? t('badge.wait', { when: whenText(next.dayOffset, t), time: next.time }) : t('badge.off')
      return { ...base, badge, hint: t('hint.wait') }
    }
    case 'paused':
      return { ...base, badge: t('badge.paused'), hint: t('hint.paused') }
    case 'err':
      return { ...base, badge: t('badge.err'), hint: t('hint.err') }
    case 'off':
      return { ...base, badge: t('badge.off'), hint: t('hint.off') }
  }
}
