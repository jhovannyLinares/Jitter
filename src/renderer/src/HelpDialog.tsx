import { useEffect, useRef, useState } from 'react'
import { GOOD_TO_KNOW, GUIDE, OPEN_SOURCE, RELEASE_NOTES, type HelpSection } from '@shared/help'
import type { Language } from '@shared/i18n'
import type { AboutInfo } from '@shared/ipc'
import logo from '../../../resources/logo.png'
import { Dialog } from './Dialog'
import { useText } from './text'

export type HelpKind = 'guide' | 'goodToKnow' | 'releaseNotes' | 'log' | 'about'

const TITLE_KEY = { guide: 'menu.guide', goodToKnow: 'menu.goodToKnow', releaseNotes: 'menu.releaseNotes', log: 'menu.log', about: 'menu.about' } as const
const SECTIONS: Partial<Record<HelpKind, Record<Language, HelpSection[]>>> = { guide: GUIDE, goodToKnow: GOOD_TO_KNOW, releaseNotes: RELEASE_NOTES }

function Sections({ sections }: { sections: HelpSection[] }) {
  return (
    <>
      {sections.map((section) =>
        section.warning ? (
          <div className="warn-box" key={section.title}>
            <b>{section.title}</b> {section.text}
          </div>
        ) : (
          <p className="help-section" key={section.title}>
            <b>{section.title}</b> {section.text}
          </p>
        )
      )}
    </>
  )
}

function About() {
  const t = useText()
  const [info, setInfo] = useState<AboutInfo | null>(null)
  useEffect(() => {
    void window.jitter.about().then(setInfo)
  }, [])
  if (!info) return null
  return (
    <>
      <div className="about-head">
        <img className="logo" src={logo} alt="" />
        <div>
          <div className="about-name">Jitter</div>
          <div className="muted">{t('about.version', { version: info.version })} · {t('app.tagline')}</div>
        </div>
      </div>
      <table className="about-table">
        <tbody>
          <tr><th colSpan={2}>{t('about.runsOn')}</th></tr>
          <tr><td>Electron</td><td>{info.electron}</td></tr>
          <tr><td>Chromium · Node</td><td>{info.chrome} · {info.node}</td></tr>
          <tr><td>Windows</td><td>{info.windows}</td></tr>
          <tr><th colSpan={2}>{t('about.inWindows')}</th></tr>
          <tr><td>{t('about.input')}</td><td>user32.dll</td></tr>
          <tr><td>{t('about.notifications')}</td><td>{info.notifications ? t('about.available') : t('about.unavailable')}</td></tr>
          <tr><th colSpan={2}>{t('about.where')}</th></tr>
          <tr><td>{t('about.data')}</td><td><span className="mono">{info.dataDir}</span> <button type="button" className="link-btn" onClick={() => void window.jitter.openPath('data')}>{t('common.open')}</button></td></tr>
          <tr><td>{t('about.logFile')}</td><td><span className="mono">{info.logFile}</span> <button type="button" className="link-btn" onClick={() => void window.jitter.openPath('log')}>{t('common.open')}</button></td></tr>
          <tr><th colSpan={2}>{t('about.openSource')}</th></tr>
          {OPEN_SOURCE.map(([name, license]) => <tr key={name}><td>{name}</td><td>{license}</td></tr>)}
        </tbody>
      </table>
      <div className="hint">{t('about.footer')}</div>
    </>
  )
}

function LogLines() {
  const t = useText()
  const [lines, setLines] = useState<string[] | null>(null)
  const linesRef = useRef<HTMLPreElement>(null)
  useEffect(() => {
    void window.jitter.readLog().then(setLines)
  }, [])
  if (lines === null) return null
  if (lines.length === 0) return <p className="hint">{t('log.empty')}</p>
  // se copia seleccionando el texto: el portapapeles por permiso está negado a la interfaz
  const copy = () => {
    const selection = window.getSelection()
    if (!linesRef.current || !selection) return
    selection.selectAllChildren(linesRef.current)
    document.execCommand('copy')
  }
  return (
    <>
      <pre className="log-lines" ref={linesRef}>{lines.join('\n')}</pre>
      <div className="row">
        <button type="button" className="btn small" onClick={copy}>{t('common.copy')}</button>
        <button type="button" className="btn small" onClick={() => void window.jitter.openPath('log')}>{t('common.openFolder')}</button>
      </div>
    </>
  )
}

interface HelpDialogProps {
  kind: HelpKind
  language: Language
  onClose: () => void
}

/** Ayuda: guía, lo que conviene saber, notas, registro y Acerca de, en un diálogo de la familia. */
export function HelpDialog({ kind, language, onClose }: HelpDialogProps) {
  const t = useText()
  const sections = SECTIONS[kind]
  return (
    <Dialog title={t(TITLE_KEY[kind])} wide={kind === 'log' || kind === 'about'} onClose={onClose} footer={<button type="button" className="btn" onClick={onClose}>{t('common.close')}</button>}>
      {sections && <Sections sections={sections[language]} />}
      {kind === 'about' && <About />}
      {kind === 'log' && <LogLines />}
    </Dialog>
  )
}

/** Primer uso: qué hace, cómo se enciende y la advertencia de la política de la empresa. */
export function WelcomeDialog({ onClose }: { onClose: () => void }) {
  const t = useText()
  return (
    <Dialog title={t('welcome.title')} onClose={onClose} footer={<button type="button" className="btn primary" id="welcome-ok" onClick={onClose}>{t('welcome.ok')}</button>}>
      <p className="help-section">{t('welcome.what')}</p>
      <p className="help-section">{t('welcome.how')}</p>
      <div className="warn-box">{t('welcome.policy')}</div>
    </Dialog>
  )
}
