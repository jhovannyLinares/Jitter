import type { Language } from './i18n'

/**
 * Guía de uso, «Lo que conviene saber» y notas de la versión. Cada sección es un título en negrita y su texto.
 * Describen el proceso, no el estado: nada de conteos ni fechas que caducan.
 */
export interface HelpSection {
  title: string
  text: string
  /** se muestra como advertencia */
  warning?: boolean
}

export const GUIDE: Record<Language, HelpSection[]> = {
  es: [
    { title: 'Encender y apagar.', text: 'El botón redondo de Inicio, clic en el ícono de la bandeja o Ctrl+Alt+P desde cualquier programa.' },
    { title: 'Por un rato.', text: 'Elige 30 min, 1 h, 2 h o «Hasta las …»: al terminar se apaga sola y te avisa.' },
    { title: 'Por horario.', text: 'En Horario marca los días y las horas. Fuera de ellas se apaga sola; el botón la enciende igual hasta la próxima hora del horario.' },
    { title: 'Cerrar no es salir.', text: 'Cerrar la ventana la deja en la bandeja. Para terminarla del todo: bandeja → Salir, o Archivo → Salir.' }
  ],
  en: [
    { title: 'Turn on and off.', text: 'The round Home button, a click on the tray icon, or Ctrl+Alt+P from any program.' },
    { title: 'For a while.', text: 'Pick 30 min, 1 h, 2 h or «Until …»: when time is up it turns off and lets you know.' },
    { title: 'By schedule.', text: 'In Schedule, tick the days and hours. Outside them it turns off by itself; the button still turns it on until the next scheduled time.' },
    { title: 'Closing is not quitting.', text: 'Closing the window keeps Jitter in the tray. To quit: tray → Quit, or File → Quit.' }
  ]
}

export const GOOD_TO_KNOW: Record<Language, HelpSection[]> = {
  es: [
    { title: 'Política de la empresa.', text: 'Simular actividad en un equipo de la empresa puede ir contra su política de uso. Antes de usarla, revísala.', warning: true },
    { title: 'La pantalla bloqueada gana.', text: 'Si bloqueas el equipo (Win+L) o se bloquea solo por directiva, Teams te marca Ausente igual. Jitter se pone en pausa y sigue al desbloquear.' },
    { title: 'No escribe nada.', text: 'La tecla F15 no existe en el teclado: ningún programa la usa. En Configuración puedes cambiarla por mover el mouse 1 píxel.' },
    { title: 'Sin administrador.', text: 'Se instala solo para tu usuario y no instala servicios.' }
  ],
  en: [
    { title: 'Company policy.', text: 'Simulating activity on a company computer may go against its usage policy. Check it before using Jitter.', warning: true },
    { title: 'A locked screen wins.', text: 'If you lock the computer (Win+L) or a policy locks it, Teams shows you as Away anyway. Jitter pauses and resumes when you unlock.' },
    { title: 'It types nothing.', text: 'Your keyboard has no F15 key: no program uses it. In Settings you can switch to a 1-pixel mouse move.' },
    { title: 'No administrator.', text: 'It installs for your user only and installs no services.' }
  ]
}

export const RELEASE_NOTES: Record<Language, HelpSection[]> = {
  es: [{ title: '0.1.0', text: 'Primera versión: encendido, temporizador, horario, bandeja, atajo Ctrl+Alt+P y pausa con la pantalla bloqueada.' }],
  en: [{ title: '0.1.0', text: 'First version: on/off, timer, schedule, tray, Ctrl+Alt+P shortcut and pause while the screen is locked.' }]
}

/** Lo que va dentro del instalador, con su licencia (Acerca de). */
export const OPEN_SOURCE = [
  ['Electron', 'MIT'],
  ['React', 'MIT'],
  ['zod', 'MIT'],
  ['koffi', 'MIT'],
  ['Open Sans', 'OFL 1.1']
] as const
