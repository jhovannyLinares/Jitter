// Genera los íconos de Jitter desde su logo vectorial (resources/logo.svg, el ratoncito de la maqueta).
// Escribe build/icon.ico (16 a 256 px), build/icon.png (512), build/icon-256.png (el de la maqueta),
// resources/logo.png (512, pantalla de carga y ventana) y los de la bandeja: tray-on / tray-off, a 16 px y @2x.
// Uso: npm run icon
import { app, BrowserWindow } from 'electron'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const ICO_SIZES = [16, 24, 32, 48, 64, 128, 256]
const TRAY_SIZES = [[16, ''], [32, '@2x']]
/** El punto de «encendida»: el mismo verde que --ok en tokens.css. */
const ON_DOT_COLOR = '#4fbf6a'
/** Apagada, el ratón queda en gris y tenue para que el punto verde sea la única diferencia que hay que buscar. */
const OFF_FILTER = 'grayscale(1) opacity(0.6)'
const logo = 'data:image/svg+xml;base64,' + readFileSync(join(here, '../resources/logo.svg')).toString('base64')

function ico(pngs) {
  const head = Buffer.alloc(6 + 16 * pngs.length)
  head.writeUInt16LE(1, 2)
  head.writeUInt16LE(pngs.length, 4)
  let offset = head.length
  pngs.forEach(([size, data], index) => {
    const entry = 6 + 16 * index
    head.writeUInt8(size % 256, entry)
    head.writeUInt8(size % 256, entry + 1)
    head.writeUInt16LE(1, entry + 4)
    head.writeUInt16LE(32, entry + 6)
    head.writeUInt32LE(data.length, entry + 8)
    head.writeUInt32LE(offset, entry + 12)
    offset += data.length
  })
  return Buffer.concat([head, ...pngs.map(([, data]) => data)])
}

app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false })
  await win.loadURL('about:blank')
  /** variant: 'plain' (el logo), 'on' (con punto verde) u 'off' (en gris) */
  const render = (size, variant) =>
    win.webContents.executeJavaScript(`new Promise((ok) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = canvas.height = ${size}
        const ctx = canvas.getContext('2d')
        ctx.imageSmoothingQuality = 'high'
        if (${JSON.stringify(variant)} === 'off') ctx.filter = ${JSON.stringify(OFF_FILTER)}
        ctx.drawImage(img, 0, 0, ${size}, ${size})
        if (${JSON.stringify(variant)} === 'on') {
          ctx.filter = 'none'
          ctx.beginPath()
          ctx.arc(${size} * 0.78, ${size} * 0.78, ${size} * 0.22, 0, Math.PI * 2)
          ctx.fillStyle = ${JSON.stringify(ON_DOT_COLOR)}
          ctx.fill()
          ctx.lineWidth = Math.max(1, ${size} * 0.07)
          ctx.strokeStyle = '#ffffff'
          ctx.stroke()
        }
        ok(canvas.toDataURL('image/png'))
      }
      img.src = ${JSON.stringify(logo)}
    })`)
  const png = async (size, variant = 'plain') => Buffer.from((await render(size, variant)).split(',')[1], 'base64')
  const icoPngs = []
  for (const size of ICO_SIZES) icoPngs.push([size, await png(size)])
  writeFileSync(join(here, 'icon.ico'), ico(icoPngs))
  const big = await png(512)
  writeFileSync(join(here, 'icon.png'), big)
  writeFileSync(join(here, '../resources/logo.png'), big)
  writeFileSync(join(here, 'icon-256.png'), icoPngs.find(([size]) => size === 256)[1])
  for (const [size, suffix] of TRAY_SIZES) {
    writeFileSync(join(here, `../resources/tray-on${suffix}.png`), await png(size, 'on'))
    writeFileSync(join(here, `../resources/tray-off${suffix}.png`), await png(size, 'off'))
  }
  console.log('icon.ico', ICO_SIZES.join(','), '+ icon.png 512 + icon-256.png + resources/logo.png + tray-on/off')
  app.quit()
})
