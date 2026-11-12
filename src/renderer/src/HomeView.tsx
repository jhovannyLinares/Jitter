import { UNTIL_CHOICES, type Snapshot, type UntilChoice } from '@shared/activity-state'
import type { Preferences } from '@shared/preferences'
import { minutesBetween } from '@shared/time'
import { statusText } from './status'
import { useText, type Translate } from './text'

interface HomeViewProps {
  snapshot: Snapshot
  preferences: Preferences
  now: number
  onToggle: () => void
  onTurnOn: (choice: UntilChoice) => void
}

function PowerIcon() {
  return (
    <svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M12 3v9" />
      <path d="M6.3 6.3a8 8 0 1 0 11.4 0" />
    </svg>
  )
}

function untilLabel(choice: UntilChoice, endOfDayTime: string, t: Translate): string {
  if (choice === 'endOfDay') return t('until.endOfDay', { time: endOfDayTime })
  return t(`until.${choice}`)
}

/** Inicio: el botón redondo, el estado en palabras y hasta cuándo queda encendida. */
export function HomeView({ snapshot, preferences, now, onToggle, onTurnOn }: HomeViewProps) {
  const t = useText()
  const status = statusText(snapshot, preferences, now, t)
  const { state, endOfDay } = snapshot
  const onForMinutes = state.onSince === null ? 0 : minutesBetween(state.onSince, now)
  return (
    <>
      <div className="power-wrap">
        <button type="button" className={`power ${status.kind}`} id="power" aria-pressed={state.on} title={state.on ? t('power.turnOff') : t('power.turnOn')} onClick={onToggle}>
          <PowerIcon />
        </button>
        <div className="power-label" id="power-label">{status.label}</div>
        <span className={`badge ${status.badgeTone}`} id="power-badge">
          <span className="dot" />
          {status.badge}
        </span>
        <p className="hint" id="power-hint">{status.hint}</p>
      </div>
      {status.kind === 'paused' && <div className="notice warn">{t('notice.locked')}</div>}
      <div className="field">
        <span className="label">{t('until.label')}</span>
        <div className="chips">
          {UNTIL_CHOICES.map((choice) => (
            <button
              type="button"
              key={choice}
              data-until={choice}
              className={state.on && state.untilChoice === choice ? 'chip on' : 'chip'}
              disabled={choice === 'endOfDay' && !endOfDay.available}
              onClick={() => onTurnOn(choice)}
            >
              {untilLabel(choice, endOfDay.time, t)}
            </button>
          ))}
        </div>
      </div>
      <div className="stats">
        <div className="stat accent">
          <b>{t('stats.minutes', { minutes: onForMinutes })}</b>
          <span>{t('stats.onFor')}</span>
        </div>
        <div className="stat">
          <b>{state.pulsesToday}</b>
          <span>{t('stats.pulses')}</span>
        </div>
      </div>
    </>
  )
}
