import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Snapshot, UntilChoice } from '@shared/activity-state'
import { resolveLanguage, translate, type TextKey } from '@shared/i18n'
import type { Preferences, PreferencesPatch } from '@shared/preferences'
import logo from '../../../resources/logo.png'
import { HelpDialog, WelcomeDialog, type HelpKind } from './HelpDialog'
import { HomeView } from './HomeView'
import { Menubar, shortcutOf, type Menu } from './Menubar'
import { ScheduleView } from './ScheduleView'
import { SettingsView } from './SettingsView'
import { methodInline, statusText } from './status'
import { LanguageContext } from './text'
import { useResolvedTheme } from './theme'

type View = 'home' | 'schedule' | 'settings'
const VIEWS: readonly (readonly [View, TextKey])[] = [['home', 'view.home'], ['schedule', 'view.schedule'], ['settings', 'view.settings']]
const CLOCK_MS = 1_000
const TOAST_MS = 3_500
const STATUS_TONE = { on: 'tone-ok', paused: 'tone-warn', err: 'tone-err', off: 'tone-off', wait: 'tone-off' } as const

/** El reloj de la pantalla: las cuentas regresivas se calculan aquí, main solo manda los instantes. */
function useNow(): number {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), CLOCK_MS)
    return () => clearInterval(timer)
  }, [])
  return now
}

export function App() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [preferences, setPreferences] = useState<Preferences | null>(null)
  const [view, setView] = useState<View>('home')
  const [help, setHelp] = useState<HelpKind | null>(null)
  const [toast, setToast] = useState<{ title: string; body: string } | null>(null)
  const now = useNow()
  const theme = useResolvedTheme(preferences?.theme ?? 'system')
  const language = resolveLanguage(preferences?.language ?? 'system', navigator.language)
  const t = useCallback((key: TextKey, values?: Record<string, string | number>) => translate(language, key, values), [language])

  useEffect(() => {
    const offSnapshot = window.jitter.onSnapshot(setSnapshot)
    const offPreferences = window.jitter.onPreferences(setPreferences)
    const offCommand = window.jitter.onCommand(() => setView('home'))
    void Promise.all([window.jitter.state(), window.jitter.preferences()]).then(([firstSnapshot, firstPreferences]) => {
      setSnapshot(firstSnapshot)
      setPreferences(firstPreferences)
      void window.jitter.ready()
    })
    return () => {
      offSnapshot()
      offPreferences()
      offCommand()
    }
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), TOAST_MS)
    return () => clearTimeout(timer)
  }, [toast])

  const change = useCallback((patch: PreferencesPatch) => void window.jitter.setPreferences(patch).then(setPreferences), [])

  const announce = useCallback((turnedOn: boolean) => {
    const minutes = preferences?.intervalMinutes ?? 0
    setToast(turnedOn ? { title: t('toast.onTitle'), body: t('toast.onBody', { minutes }) } : { title: t('toast.offTitle'), body: t('toast.offBody') })
  }, [preferences, t])

  const toggle = useCallback(() => {
    const turningOn = !snapshot?.state.on
    void window.jitter.toggle().then(() => announce(turningOn))
  }, [snapshot, announce])

  const turnOn = useCallback((choice: UntilChoice) => void window.jitter.turnOn(choice).then(() => announce(true)), [announce])

  const closeToTray = useCallback(() => {
    setToast({ title: t('toast.trayTitle'), body: t('toast.trayBody') })
    void window.jitter.hide()
  }, [t])

  const menus: Menu[] = useMemo(() => [
    { title: t('menu.file'), items: [
      { label: t('menu.toggle'), shortcut: 'Ctrl+Alt+P', action: toggle },
      { label: t('menu.closeToTray'), shortcut: 'Ctrl+W', action: closeToTray },
      null,
      { label: t('menu.quit'), shortcut: 'Ctrl+Q', action: () => void window.jitter.quit() }
    ] },
    { title: t('menu.edit'), items: [
      { label: t('menu.copy'), shortcut: 'Ctrl+C', action: () => document.execCommand('copy') },
      { label: t('menu.selectAll'), shortcut: 'Ctrl+A', action: () => document.execCommand('selectAll') }
    ] },
    { title: t('menu.view'), items: [
      { label: t('view.home'), shortcut: 'Ctrl+1', action: () => setView('home') },
      { label: t('view.schedule'), shortcut: 'Ctrl+2', action: () => setView('schedule') }
    ] },
    { title: t('menu.tools'), items: [{ label: t('menu.settings'), shortcut: 'Ctrl+,', action: () => setView('settings') }] },
    { title: t('menu.help'), items: [
      { label: t('menu.guide'), shortcut: 'F1', action: () => setHelp('guide') },
      { label: t('menu.goodToKnow'), action: () => setHelp('goodToKnow') },
      { label: t('menu.releaseNotes'), action: () => setHelp('releaseNotes') },
      { label: t('menu.log'), action: () => setHelp('log') },
      null,
      { label: t('menu.about'), action: () => setHelp('about') }
    ] }
  ], [t, toggle, closeToTray])

  useEffect(() => {
    const byShortcut = new Map(menus.flatMap((menu) => menu.items).filter((item) => item?.shortcut && item.action).map((item) => [item!.shortcut!, item!.action!]))
    const onKey = (event: KeyboardEvent) => {
      // Ctrl+C y Ctrl+A los resuelve el navegador sobre la selección; el atajo global lo atiende main
      const shortcut = shortcutOf(event)
      if (['Ctrl+C', 'Ctrl+A', 'Ctrl+Alt+P'].includes(shortcut)) return
      const action = byShortcut.get(shortcut)
      if (!action) return
      event.preventDefault()
      action()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [menus])

  if (!snapshot || !preferences) return null
  const status = statusText(snapshot, preferences, now, t)
  const tone = STATUS_TONE[status.kind]
  const signals = snapshot.state.on ? t('status.every', { minutes: preferences.intervalMinutes, method: methodInline(preferences, t) }) : t('status.none')

  return (
    <LanguageContext.Provider value={language}>
      <div className="app" data-theme-resolved={theme}>
        <div className="topbar">
          <img className="logo" src={logo} alt="" />
          <Menubar menus={menus} />
        </div>
        <div className="toolbar view-tabs">
          <div className="segmented" role="tablist">
            {VIEWS.map(([key, label]) => (
              <button type="button" role="tab" key={key} data-view={key} aria-selected={view === key} className={view === key ? 'on' : ''} onClick={() => setView(key)}>
                {t(label)}
              </button>
            ))}
          </div>
        </div>
        <div className="view">
          {view === 'home' && <HomeView snapshot={snapshot} preferences={preferences} now={now} onToggle={toggle} onTurnOn={turnOn} />}
          {view === 'schedule' && <ScheduleView schedule={preferences.schedule} onChange={(schedule) => change({ schedule })} />}
          {view === 'settings' && <SettingsView preferences={preferences} shortcutActive={snapshot.shortcutActive} onChange={change} />}
        </div>
        <div className="statusbar">
          <span className={tone}>● {status.label}</span>
          <span id="status-signals">{signals}</span>
          <span className="statusbar-right">{t('status.today', { count: snapshot.state.pulsesToday })}</span>
        </div>
        {toast && (
          <div className="toast" role="status">
            <b>{toast.title}</b> {toast.body}
          </div>
        )}
        {help && <HelpDialog kind={help} language={language} onClose={() => setHelp(null)} />}
        {!preferences.welcomed && <WelcomeDialog onClose={() => change({ welcomed: true })} />}
      </div>
    </LanguageContext.Provider>
  )
}
