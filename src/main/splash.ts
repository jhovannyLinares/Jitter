import { BrowserWindow } from 'electron'
import { readFileSync } from 'node:fs'
import logoPath from '../../resources/logo.png?asset'

/**
 * Pantalla de carga con el patrón de la familia: el ratoncito flotando, el nombre y el texto de carga. Solo CSS, sin
 * scripts; el logo va embebido. Los colores son los de tokens.css del tema activo: corre antes que la interfaz.
 */
export type SplashTheme = 'light' | 'dark'

const SPLASH_COLORS: Record<SplashTheme, { background: string; title: string; text: string }> = {
  dark: { background: '#15171f', title: '#ffffff', text: '#979db2' },
  light: { background: '#f4f5f9', title: '#131624', text: '#5c6276' }
}

export const splashBackground = (theme: SplashTheme) => SPLASH_COLORS[theme].background

function splashHtml(loading: string, theme: SplashTheme, logoDataUrl: string): string {
  const colors = SPLASH_COLORS[theme]
  return `<!doctype html><html><head><meta charset="utf-8"><title>Jitter</title><style>
html,body{margin:0;height:100%;background:${colors.background};overflow:hidden;font-family:'Open Sans','Segoe UI',Arial,sans-serif;-webkit-user-select:none;user-select:none}
body{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;-webkit-app-region:drag}
img{animation:float 2.6s ease-in-out infinite}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
@media (prefers-reduced-motion: reduce){img{animation:none}}
h1{margin:0;font-size:30px;font-weight:600;letter-spacing:6px;color:${colors.title}}
p{margin:0;font-size:13px;color:${colors.text}}
</style></head><body>
<img src="${logoDataUrl}" width="170" height="170" alt="">
<h1>JITTER</h1><p>${loading}</p>
</body></html>`
}

/** Sin este mínimo el logo parpadea: la carga y la ventana terminan casi a la vez. */
const SPLASH_MIN_VISIBLE_MS = 400

let logoPaintedAt: number | null = null

/** Sin marco, encima, sin Node ni preload. Se muestra cuando pintó, para que marco y logo aparezcan juntos. */
export function openSplash(loading: string, theme: SplashTheme): BrowserWindow {
  const win = new BrowserWindow({
    width: 260,
    height: 480,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    center: true,
    show: false,
    backgroundColor: splashBackground(theme),
    webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false, javascript: false }
  })
  const logo = 'data:image/png;base64,' + readFileSync(logoPath).toString('base64')
  win.once('ready-to-show', () => {
    win.show()
    logoPaintedAt = Date.now()
  })
  void win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(splashHtml(loading, theme, logo))}`)
  return win
}

/** Cierra la carga cuando el logo ya se vio, dejando el mínimo visible. */
export function closeWhenSeen(win: BrowserWindow): void {
  if (win.isDestroyed()) return
  if (logoPaintedAt === null) {
    win.once('ready-to-show', () => closeWhenSeen(win))
    return
  }
  const remainingMs = Math.max(0, SPLASH_MIN_VISIBLE_MS - (Date.now() - logoPaintedAt))
  setTimeout(() => {
    if (!win.isDestroyed()) win.close()
  }, remainingMs)
}
