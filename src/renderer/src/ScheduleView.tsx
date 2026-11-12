import type { TextKey } from '@shared/i18n'
import { dayIsValid, type DaySchedule, type Schedule } from '@shared/schedule'
import { useText } from './text'

interface ScheduleViewProps {
  schedule: Schedule
  onChange: (schedule: Schedule) => void
}

/** Horario: días y horas en que Jitter se enciende y se apaga sola. */
export function ScheduleView({ schedule, onChange }: ScheduleViewProps) {
  const t = useText()
  const updateDay = (index: number, patch: Partial<DaySchedule>) =>
    onChange({ ...schedule, days: schedule.days.map((day, dayIndex) => (dayIndex === index ? { ...day, ...patch } : day)) })
  const anyInvalid = schedule.days.some((day) => day.enabled && !dayIsValid(day))
  return (
    <>
      <span className="view-title">{t('view.schedule')}</span>
      <label className="check">
        <input type="checkbox" id="schedule-enabled" checked={schedule.enabled} onChange={(event) => onChange({ ...schedule, enabled: event.target.checked })} />
        <span>
          {t('schedule.enable')}
          <small>{t('schedule.enableHint')}</small>
        </span>
      </label>
      <div className="setting">
        {schedule.days.map((day, index) => {
          const name = t(`day.${index}` as TextKey)
          const invalid = day.enabled && !dayIsValid(day)
          return (
            <div className={`sched-row${day.enabled ? '' : ' off'}${invalid ? ' invalid' : ''}`} key={name}>
              <label className="check">
                <input type="checkbox" checked={day.enabled} onChange={(event) => updateDay(index, { enabled: event.target.checked })} />
                {name}
              </label>
              <input type="time" value={day.from} aria-label={t('schedule.from', { day: name })} onChange={(event) => event.target.value && updateDay(index, { from: event.target.value })} />
              <span className="muted">{t('schedule.to')}</span>
              <input type="time" value={day.to} aria-label={t('schedule.until', { day: name })} onChange={(event) => event.target.value && updateDay(index, { to: event.target.value })} />
            </div>
          )
        })}
        {anyInvalid && <span className="error-text">{t('schedule.invalid')}</span>}
      </div>
      <p className="hint">{t('schedule.manualWins')}</p>
    </>
  )
}
