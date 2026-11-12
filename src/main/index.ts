import { app, BrowserWindow, globalShortcut, ipcMain, nativeTheme, Notification, powerMonitor, shell, type IpcMainInvokeEvent } from 'electron'
import { release } from 'node:os'
import { join } from 'node:path'
import type { Snapshot } from '@shared/activity-state'
import { resolveLanguage, translate, type TextKey } from '@shared/i18n'
import { EVENT_COMMAND, EVENT_PREFERENCES, EVENT_SNAPSHOT } from '@shared/events'
import { OpenTargetSchema, UntilSchema, type AboutInfo } from '@shared/ipc'
import { jitterHomePath, LOG_FILE, PreferencesPatchSchema, PreferencesSchema, type Preferences } from '@shared/preferences'
import logoPath from '../../resources/logo.png?asset'
import { ActivityController } from './controller'
import { sendPulse } from './input'
import { createLogger, readLogTail } from './log'
import { closeWhenSeen, openSplash, splashBackground, type SplashTheme } from './splash'
import { loadPreferences, savePreferences } from './store'
import { AppTray } from './tray'

/** Ventana, bandeja, atajo y Windows. El estado lo lleva ActivityController; aquí solo se conecta. */

const isDev = !app.isPackaged && !!process.env.ELECTRON_RENDERER_URL
const CSP = isDev
  ? "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self' ws: http://localhost:*"
  : "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-src 'none'"

/** Ventana de la maqueta (lámina 4): 440×600, mínimo 400×540. */
const WINDOW_SIZE = { width: 440, height: 600, minWidth: 400, minHeight: 540 }
const SPLASH_TIMEOUT_MS = 20_000
const TICK_MS = 1_000
const LOG_TAIL_LINES = 200
/** Si después de Salir el proceso sigue vivo, se fuerza: el instalador no puede reemplazar una app abierta. */
const QUIT_GRACE_MS = 5_000
/** Arrancada por Windows al iniciar sesión: va directo a la bandeja, sin carga ni ventana. */
const HIDDEN_ARG = '--hidden'
const SHORTCUT = 'Control+Alt+P'
/** Identidad en Windows; desarrollo usa otra para no tomarle el ícono de la barra de tareas a la instalada. */
const APP_USER_MODEL_ID = 'com.jhovanny.jitter'

const dataDir = jitterHomePath(process.env, app.getPath('appData'))
const logFile = join(dataDir, 'logs', LOG_FILE)
const log = createLogger(logFile, process.env.JITTER_DEBUG === '1')

let preferences: Preferences = loadPreferences(dataDir, log)
let mainWindow: BrowserWindow | null = null
let splash: BrowserWindow | null = null
let tray: AppTray | null = null
let ticker: NodeJS.Timeout | null = null
let quitting = false

const language = () => resolveLanguage(preferences.language, app.getLocale())
const t = (key: TextKey, values?: Record<string, string | number>) => translate(language(), key, values)

const controller = new ActivityController(preferences, {
  now: Date.now,
  sendPulse,
  notify: showNotification,
  onChange: publishSnapshot,
  log
})

function publishSnapshot(snapshot: Snapshot): void {
  tray?.update(snapshot, preferences.schedule.enabled, t)
  mainWindow?.webContents.send(EVENT_SNAPSHOT, snapshot)
  if (snapshot.state.on !== preferences.lastOn) updatePreferences({ ...preferences, lastOn: snapshot.state.on })
}

function showNotification(title: TextKey, body: TextKey, values?: Record<string, string | number>): void {
  if (!Notification.isSupported()) return
  const notification = new Notification({ title: t(title, values), body: t(body, values), icon: logoPath })
  notification.on('click', showWindow)
  notification.show()
}

/** Guarda, aplica y avisa. Si el disco falla, la app sigue con lo nuevo en memoria y lo deja en el registro. */
function updatePreferences(next: Preferences): void {
  const previous = preferences
  preferences = next
  try {
    savePreferences(dataDir, next)
  } catch (error) {
    log.error('preferences.save', { dataDir, error: String(error), action: 'el cambio vale hasta cerrar la app' })
  }
  if (next.startWithWindows !== previous.startWithWindows) applyLoginItem()
  if (next.theme !== previous.theme) nativeTheme.themeSource = next.theme
  controller.setPreferences(next)
  mainWindow?.webContents.send(EVENT_PREFERENCES, next)
}

function applyLoginItem(): void {
  // en desarrollo registraría el electron.exe de node_modules: solo la instalada se agrega al inicio
  if (!app.isPackaged) return
  app.setLoginItemSettings({ openAtLogin: preferences.startWithWindows, args: [HIDDEN_ARG] })
}

/** Solo responde a la propia interfaz: la página cargada desde el paquete, o el servidor de desarrollo. */
function fromOurInterface(event: IpcMainInvokeEvent): boolean {
  const url = event.senderFrame?.url ?? ''
  if (isDev) return url.startsWith(process.env.ELECTRON_RENDERER_URL!)
  return url.startsWith('file://')
}

function handle(channel: string, handler: (payload: unknown) => unknown): void {
  ipcMain.handle(channel, (event, payload: unknown) => {
    if (!fromOurInterface(event)) {
      log.warn('ipc.rejected', { channel, reason: 'origen desconocido' })
      throw new Error('Origen desconocido')
    }
    return handler(payload)
  })
}

async function aboutInfo(): Promise<AboutInfo> {
  return {
    version: app.getVersion(),
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
    windows: release(),
    notifications: Notification.isSupported(),
    dataDir,
    logFile
  }
}

function registerIpc(): void {
  handle('state:get', () => controller.snapshot())
  handle('power:toggle', () => controller.toggle('button'))
  handle('power:on', (payload) => controller.turnOn(UntilSchema.parse(payload), 'button'))
  handle('power:off', () => controller.turnOff('button'))
  handle('prefs:get', () => preferences)
  handle('prefs:set', (payload) => {
    const patch = PreferencesPatchSchema.parse(payload)
    updatePreferences(PreferencesSchema.parse({ ...preferences, ...patch }))
    return preferences
  })
  handle('app:about', () => aboutInfo())
  handle('app:ready', () => {
    if (splash) closeWhenSeen(splash)
    splash = null
  })
  handle('app:hide', () => mainWindow?.hide())
  handle('app:quit', () => quit())
  // solo dos rutas conocidas, nunca una que mande la interfaz: openPath ejecuta lo que abre
  handle('app:openPath', async (payload) => {
    const target = OpenTargetSchema.parse(payload)
    return (await shell.openPath(target === 'data' ? dataDir : logFile)) === ''
  })
  handle('log:read', () => readLogTail(logFile, LOG_TAIL_LINES))
}

function createWindow(backgroundColor: string, visible: boolean): void {
  mainWindow = new BrowserWindow({
    ...WINDOW_SIZE,
    backgroundColor,
    title: 'Jitter',
    icon: logoPath,
    show: false,
    autoHideMenuBar: true,
    webPreferences: { preload: join(__dirname, '../preload/index.js'), sandbox: true, contextIsolation: true, devTools: isDev }
  })
  mainWindow.setMenu(null)
  mainWindow.webContents.session.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false))
  mainWindow.webContents.session.setPermissionCheckHandler(() => false)
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) =>
    callback({ responseHeaders: { ...details.responseHeaders, 'Content-Security-Policy': [CSP] } })
  )
  mainWindow.webContents.on('will-navigate', (event) => event.preventDefault())
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  if (isDev) void mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL!)
  else void mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  if (visible) mainWindow.once('ready-to-show', () => mainWindow?.show())
  // cerrar no apaga: Jitter sigue en la bandeja
  mainWindow.on('close', (event) => {
    if (quitting || !preferences.keepInTray) return
    event.preventDefault()
    mainWindow?.hide()
  })
  mainWindow.on('closed', () => (mainWindow = null))
}

function showWindow(): void {
  if (!mainWindow) return
  if (mainWindow.isMinimized()) mainWindow.restore()
  mainWindow.show()
  mainWindow.focus()
  mainWindow.webContents.send(EVENT_COMMAND, 'show-home')
}

function registerShortcut(): void {
  controller.shortcutActive = globalShortcut.register(SHORTCUT, () => controller.toggle('shortcut'))
  if (!controller.shortcutActive) log.warn('shortcut.taken', { shortcut: SHORTCUT, action: 'el atajo queda inactivo; la bandeja y el botón siguen' })
}

/** Salir: deja de simular, suelta el atajo, quita el ícono y cierra todas las ventanas. */
function quit(): void {
  quitting = true
  if (ticker) clearInterval(ticker)
  globalShortcut.unregisterAll()
  log.info('app.quit', { on: controller.current.on })
  tray?.destroy()
  tray = null
  for (const window of BrowserWindow.getAllWindows()) window.destroy()
  setTimeout(() => {
    log.warn('app.quit.forced', { graceMs: QUIT_GRACE_MS })
    app.exit(0)
  }, QUIT_GRACE_MS).unref()
  app.quit()
}

function startupTheme(): SplashTheme {
  if (preferences.theme !== 'system') return preferences.theme
  return nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
}

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', showWindow)

  void app.whenReady().then(() => {
    app.setAppUserModelId(app.isPackaged ? APP_USER_MODEL_ID : `${APP_USER_MODEL_ID}.dev`)
    nativeTheme.themeSource = preferences.theme
    const hidden = process.argv.includes(HIDDEN_ARG)
    log.info('app.start', { version: app.getVersion(), hidden })
    const theme = startupTheme()
    if (!hidden) {
      const loadingWindow = openSplash(t('splash.loading'), theme)
      splash = loadingWindow
      setTimeout(() => {
        if (!loadingWindow.isDestroyed()) loadingWindow.close()
      }, SPLASH_TIMEOUT_MS)
    }
    registerIpc()
    createWindow(splashBackground(theme), !hidden)
    tray = new AppTray({
      toggle: () => controller.toggle('tray'),
      turnOn: (choice) => controller.turnOn(choice, 'tray'),
      setFollowSchedule: (follow) => updatePreferences({ ...preferences, schedule: { ...preferences.schedule, enabled: follow } }),
      open: showWindow,
      quit
    })
    registerShortcut()
    applyLoginItem()
    powerMonitor.on('lock-screen', () => controller.setLocked(true))
    powerMonitor.on('unlock-screen', () => controller.setLocked(false))
    controller.start()
    ticker = setInterval(() => controller.tick(), TICK_MS)
  })
}

app.on('before-quit', () => {
  quitting = true
})
app.on('window-all-closed', () => {
  if (!preferences.keepInTray) quit()
})
app.on('will-quit', () => globalShortcut.unregisterAll())
