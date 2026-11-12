import { useEffect, useState } from 'react'
import type { TextKey } from '@shared/i18n'
import { MAX_INTERVAL_MINUTES, MIN_INTERVAL_MINUTES, type Preferences, type PreferencesPatch } from '@shared/preferences'
import { useText } from './text'

interface SettingsViewProps {
  preferences: Preferences
  shortcutActive: boolean
  onChange: (patch: PreferencesPatch) => void
}

interface SegmentedProps<Value extends string> {
  id: string
  value: Value
  options: readonly (readonly [Value, TextKey])[]
  onChange: (value: Value) => void
}

function Segmented<Value extends string>({ id, value, options, onChange }: SegmentedProps<Value>) {
  const t = useText()
  return (
    <div className="segmented" id={id} role="radiogroup">
      {options.map(([option, label]) => (
        <button type="button" key={option} role="radio" aria-checked={value === option} className={value === option ? 'on' : ''} data-value={option} onClick={() => onChange(option)}>
          {t(label)}
        </button>
      ))}
    </div>
  )
}

const METHODS = [['f15', 'method.f15'], ['mouse', 'method.mouse']] as const
const STARTUPS = [['off', 'startup.off'], ['last', 'startup.last'], ['schedule', 'startup.schedule']] as const
const THEMES = [['system', 'theme.system'], ['dark', 'theme.dark'], ['light', 'theme.light']] as const
const LANGUAGES = [['system', 'language.system'], ['es', 'language.es'], ['en', 'language.en']] as const

/** El número que se escribe se guarda al salir del campo, ajustado al rango: mientras se escribe puede estar vacío. */
function clampInterval(text: string, fallback: number): number {
  const typed = Number.parseInt(text, 10)
  if (Number.isNaN(typed)) return fallback
  return Math.min(MAX_INTERVAL_MINUTES, Math.max(MIN_INTERVAL_MINUTES, typed))
}

/** Configuración: cada cuánto y cómo, al iniciar, avisos y atajo, apariencia. */
export function SettingsView({ preferences, shortcutActive, onChange }: SettingsViewProps) {
  const t = useText()
  const [intervalText, setIntervalText] = useState(String(preferences.intervalMinutes))
  useEffect(() => setIntervalText(String(preferences.intervalMinutes)), [preferences.intervalMinutes])
  const commitInterval = () => {
    const minutes = clampInterval(intervalText, preferences.intervalMinutes)
    setIntervalText(String(minutes))
    if (minutes !== preferences.intervalMinutes) onChange({ intervalMinutes: minutes })
  }
  return (
    <>
      <span className="view-title">{t('view.settings')}</span>
      <div className="setting">
        <h4>{t('settings.activity')}</h4>
        <label className="check">
          <span>
            {t('settings.intervalBefore')}{' '}
            <input
              className="inline-num"
              id="interval"
              type="number"
              min={MIN_INTERVAL_MINUTES}
              max={MAX_INTERVAL_MINUTES}
              value={intervalText}
              onChange={(event) => setIntervalText(event.target.value)}
              onBlur={commitInterval}
              onKeyDown={(event) => event.key === 'Enter' && commitInterval()}
            />{' '}
            {t('settings.intervalAfter')}
            <small>{t('settings.intervalHint')}</small>
          </span>
        </label>
        <span className="label">{t('settings.how')}</span>
        <Segmented id="method" value={preferences.method} options={METHODS} onChange={(method) => onChange({ method })} />
        <p className="hint">{preferences.method === 'f15' ? t('method.f15Hint') : t('method.mouseHint')}</p>
      </div>
      <div className="setting">
        <h4>{t('settings.startup')}</h4>
        <label className="check">
          <input type="checkbox" id="start-with-windows" checked={preferences.startWithWindows} onChange={(event) => onChange({ startWithWindows: event.target.checked })} />
          <span>{t('settings.startWithWindows')}</span>
        </label>
        <label className="check">
          <input type="checkbox" id="keep-in-tray" checked={preferences.keepInTray} onChange={(event) => onChange({ keepInTray: event.target.checked })} />
          <span>{t('settings.keepInTray')}</span>
        </label>
        <span className="label">{t('settings.startState')}</span>
        <Segmented id="startup" value={preferences.startup} options={STARTUPS} onChange={(startup) => onChange({ startup })} />
      </div>
      <div className="setting">
        <h4>{t('settings.noticesShortcut')}</h4>
        <label className="check">
          <input type="checkbox" id="notify" checked={preferences.notify} onChange={(event) => onChange({ notify: event.target.checked })} />
          <span>{t('settings.notify')}</span>
        </label>
        <div className="kbd-line">
          <span>{t('settings.shortcut')}</span>
          <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>P</kbd>
        </div>
        {!shortcutActive && <div className="notice warn">{t('settings.shortcutBusy')}</div>}
      </div>
      <div className="setting">
        <h4>{t('settings.appearance')}</h4>
        <span className="label">{t('settings.theme')}</span>
        <Segmented id="theme" value={preferences.theme} options={THEMES} onChange={(theme) => onChange({ theme })} />
        <span className="label">{t('settings.language')}</span>
        <Segmented id="language" value={preferences.language} options={LANGUAGES} onChange={(language) => onChange({ language })} />
      </div>
    </>
  )
}
