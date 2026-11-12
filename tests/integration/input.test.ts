import { describe, expect, it } from 'vitest'
import { idleMilliseconds, sendPulse } from '../../src/main/input'

/**
 * La señal real contra Windows: después de enviarla, el contador de inactividad (el que mira Teams) vuelve a cero.
 * Control positivo: antes de enviar, el equipo tiene que llevar un rato sin actividad; si no, el «cero» de después
 * no probaría nada. Si alguien está usando el teclado, se espera a que pare (con tope).
 */
const QUIET_BEFORE_MS = 500
const RESET_TOLERANCE_MS = 200
const WAIT_FOR_QUIET_MS = 20_000
const POLL_MS = 100

async function waitForQuiet(): Promise<number> {
  const deadline = Date.now() + WAIT_FOR_QUIET_MS
  while (idleMilliseconds() < QUIET_BEFORE_MS) {
    if (Date.now() > deadline) throw new Error('El equipo no quedó quieto: no se puede medir la señal')
    await new Promise((resolve) => setTimeout(resolve, POLL_MS))
  }
  return idleMilliseconds()
}

describe('señal de actividad (SendInput)', () => {
  for (const method of ['f15', 'mouse'] as const) {
    it(`${method}: Windows la acepta y reinicia la inactividad`, async () => {
      const idleBefore = await waitForQuiet()
      expect(idleBefore).toBeGreaterThanOrEqual(QUIET_BEFORE_MS)
      expect(sendPulse(method)).toBe(true)
      expect(idleMilliseconds()).toBeLessThan(RESET_TOLERANCE_MS)
    })
  }
})
