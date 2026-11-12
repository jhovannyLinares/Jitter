import { Menu, nativeImage, Tray } from 'electron'
import { statusKind, type Snapshot, type UntilChoice } from '@shared/activity-state'
import type { TextKey } from '@shared/i18n'
import { clockTime } from '@shared/time'
import trayOnPath from '../../resources/tray-on.png?asset'
import trayOffPath from '../../resources/tray-off.png?asset'

/** Lo que la bandeja le pide a main. */
export interface TrayActions {
  toggle: () => void
  turnOn: (choice: UntilChoice) => void
  setFollowSchedule: (follow: boolean) => void
  open: () => void
  quit: () => void
}

type Translate = (key: TextKey, values?: Record<string, string | number>) => string

/**
 * Ícono de la bandeja: el ratoncito con punto verde encendida, en gris apagada. Clic izquierdo cambia
 * encendida/apagada; clic derecho abre el menú (lámina 6 de la maqueta).
 */
export class AppTray {
  private readonly tray: Tray
  // nativeImage toma solo el @2x al lado de cada archivo para pantallas con escala
  private readonly icons = { on: nativeImage.createFromPath(trayOnPath), off: nativeImage.createFromPath(trayOffPath) }

  constructor(private readonly actions: TrayActions) {
    this.tray = new Tray(this.icons.off)
    this.tray.on('click', () => actions.toggle())
  }

  update(snapshot: Snapshot, followingSchedule: boolean, t: Translate): void {
    const { state } = snapshot
    const kind = statusKind(state, snapshot.scheduleWaiting)
    this.tray.setImage(state.on && kind !== 'paused' ? this.icons.on : this.icons.off)
    this.tray.setToolTip(this.tooltip(snapshot, kind, t))
    const stateLabel = t(`state.${kind}`)
    const endOfDay = snapshot.endOfDay
    this.tray.setContextMenu(Menu.buildFromTemplate([
      { label: `Jitter · ${stateLabel}`, enabled: false },
      { type: 'separator' },
      { label: state.on ? t('tray.turnOff') : t('tray.turnOn'), accelerator: 'Ctrl+Alt+P', click: () => this.actions.toggle() },
      { label: t('tray.for30'), click: () => this.actions.turnOn('30') },
      { label: t('tray.for60'), click: () => this.actions.turnOn('60') },
      { label: t('tray.for120'), click: () => this.actions.turnOn('120') },
      { label: t('tray.untilEnd', { time: endOfDay.time }), enabled: endOfDay.available, click: () => this.actions.turnOn('endOfDay') },
      { type: 'separator' },
      { label: t('tray.followSchedule'), type: 'checkbox', checked: followingSchedule, click: (item) => this.actions.setFollowSchedule(item.checked) },
      { label: t('tray.open'), click: () => this.actions.open() },
      { type: 'separator' },
      { label: t('menu.quit'), click: () => this.actions.quit() }
    ]))
  }

  private tooltip(snapshot: Snapshot, kind: string, t: Translate): string {
    if (kind === 'paused') return t('tray.tooltipPaused')
    if (!snapshot.state.on) return t('tray.tooltipOff')
    const endsAt = snapshot.state.endsAt
    return endsAt === null ? t('tray.tooltipOn') : t('tray.tooltipOnUntil', { time: clockTime(endsAt) })
  }

  destroy(): void {
    this.tray.destroy()
  }
}
