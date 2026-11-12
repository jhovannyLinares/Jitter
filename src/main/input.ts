import koffi from 'koffi'

/**
 * La señal de actividad, con SendInput de user32: lo mismo que una tecla o un movimiento real, que reinicia el
 * contador de inactividad de Windows (el que mira Teams). Sin administrador. SendInput devuelve cuántos eventos
 * aceptó: 0 es que Windows lo bloqueó (por ejemplo, una ventana con más privilegios en primer plano o una directiva).
 */
const user32 = koffi.load('user32.dll')
const kernel32 = koffi.load('kernel32.dll')

const MOUSEINPUT = koffi.struct('MOUSEINPUT', { dx: 'int32', dy: 'int32', mouseData: 'uint32', dwFlags: 'uint32', time: 'uint32', dwExtraInfo: 'uintptr_t' })
const KEYBDINPUT = koffi.struct('KEYBDINPUT', { wVk: 'uint16', wScan: 'uint16', dwFlags: 'uint32', time: 'uint32', dwExtraInfo: 'uintptr_t' })
const HARDWAREINPUT = koffi.struct('HARDWAREINPUT', { uMsg: 'uint32', wParamL: 'uint16', wParamH: 'uint16' })
const INPUT_UNION = koffi.union('INPUT_UNION', { mi: MOUSEINPUT, ki: KEYBDINPUT, hi: HARDWAREINPUT })
const INPUT = koffi.struct('INPUT', { type: 'uint32', u: INPUT_UNION })
const LASTINPUTINFO = koffi.struct('LASTINPUTINFO', { cbSize: 'uint32', dwTime: 'uint32' })

const SendInput = user32.func('uint32 __stdcall SendInput(uint32 count, INPUT *inputs, int32 size)')
const GetLastInputInfo = user32.func('bool __stdcall GetLastInputInfo(_Inout_ LASTINPUTINFO *info)')
const GetTickCount = kernel32.func('uint32 __stdcall GetTickCount()')

const INPUT_MOUSE = 0
const INPUT_KEYBOARD = 1
/** F15: existe en Windows y no en los teclados; ningún programa la usa, así que no escribe ni dispara nada. */
const VK_F15 = 0x7e
const KEYEVENTF_KEYUP = 0x2
const MOUSEEVENTF_MOVE = 0x1
const ONE_PIXEL = 1

export type PulseMethod = 'f15' | 'mouse'

function send(input: Record<string, unknown>): boolean {
  return SendInput(1, input, koffi.sizeof(INPUT)) === 1
}

const key = (flags: number) => ({ type: INPUT_KEYBOARD, u: { ki: { wVk: VK_F15, wScan: 0, dwFlags: flags, time: 0, dwExtraInfo: 0 } } })
const move = (dx: number) => ({ type: INPUT_MOUSE, u: { mi: { dx, dy: 0, mouseData: 0, dwFlags: MOUSEEVENTF_MOVE, time: 0, dwExtraInfo: 0 } } })

/** Envía la señal. Devuelve false si Windows no la aceptó. */
export function sendPulse(method: PulseMethod): boolean {
  if (method === 'f15') {
    const pressed = send(key(0))
    const released = send(key(KEYEVENTF_KEYUP))
    return pressed && released
  }
  const away = send(move(ONE_PIXEL))
  const back = send(move(-ONE_PIXEL))
  return away && back
}

/** Milisegundos desde la última entrada de teclado o mouse, según Windows. */
export function idleMilliseconds(): number {
  const info = { cbSize: koffi.sizeof(LASTINPUTINFO), dwTime: 0 }
  if (!GetLastInputInfo(info)) throw new Error('GetLastInputInfo falló')
  // los dos contadores son de 32 bits y dan la vuelta cada 49,7 días: la resta sin signo lo absorbe
  return (GetTickCount() - info.dwTime) >>> 0
}
