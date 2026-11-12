import { EN } from './i18n-en'

/** Textos de la interfaz en español. El inglés (i18n-en.ts) está tipado contra este: si falta una clave, no compila. */
export const ES = {
  'app.tagline': 'Mantiene tu estado activo mientras trabajas.',
  'splash.loading': 'Preparando…',

  'menu.file': 'Archivo',
  'menu.edit': 'Editar',
  'menu.view': 'Ver',
  'menu.tools': 'Herramientas',
  'menu.help': 'Ayuda',
  'menu.toggle': 'Encender o apagar',
  'menu.closeToTray': 'Cerrar la ventana (sigue en la bandeja)',
  'menu.quit': 'Salir',
  'menu.copy': 'Copiar',
  'menu.selectAll': 'Seleccionar todo',
  'menu.settings': 'Configuración',
  'menu.guide': 'Guía de uso',
  'menu.goodToKnow': 'Lo que conviene saber',
  'menu.releaseNotes': 'Notas de la versión',
  'menu.log': 'Registro',
  'menu.about': 'Acerca de Jitter',

  'view.home': 'Inicio',
  'view.schedule': 'Horario',
  'view.settings': 'Configuración',

  'state.on': 'Encendida',
  'state.off': 'Apagada',
  'state.wait': 'Esperando horario',
  'state.paused': 'En pausa',
  'state.err': 'Con error',

  'badge.on': 'Activa · próxima señal en {time}',
  'badge.off': 'Apagada',
  'badge.wait': 'Se enciende {when} a las {time}',
  'badge.paused': 'Pantalla bloqueada',
  'badge.err': 'No pudo simular actividad',
  'when.today': 'hoy',
  'when.tomorrow': 'mañana',
  'when.inDays': 'en {days} días',

  'hint.on': 'Simula actividad cada {minutes} minutos con la {method}, {timer}.',
  'hint.off': 'Windows cuenta la inactividad de forma normal.',
  'hint.wait': 'Fuera del horario está apagada. El botón la enciende igual hasta la próxima hora del horario.',
  'hint.paused': 'Con la pantalla bloqueada Windows marca Ausente igual. Sigue sola al desbloquear.',
  'hint.err': 'Windows rechazó la señal; puede ser una directiva del equipo. El detalle está en Ayuda → Registro.',
  'timer.forever': 'hasta que la apagues',
  'timer.left': 'se apaga en {time}',
  'timer.until': 'hasta las {time}',
  'method.f15Inline': 'tecla F15',
  'method.mouseInline': 'mouse 1 píxel',
  'notice.locked': 'La pantalla está bloqueada: Windows no cuenta actividad hasta que la desbloquees.',
  'power.turnOn': 'Encender (Ctrl+Alt+P)',
  'power.turnOff': 'Apagar (Ctrl+Alt+P)',

  'until.label': '¿Hasta cuándo?',
  'until.forever': 'Hasta que la apague',
  'until.30': '30 min',
  'until.60': '1 h',
  'until.120': '2 h',
  'until.endOfDay': 'Hasta las {time}',

  'stats.minutes': '{minutes} min',
  'stats.onFor': 'encendida en esta sesión',
  'stats.pulses': 'señales enviadas hoy',
  'status.every': 'Señal cada {minutes} min · {method}',
  'status.none': 'Sin señales',
  'status.today': 'Hoy: {count} señales',

  'schedule.enable': 'Encender y apagar sola según este horario.',
  'schedule.enableHint': 'Fuera del horario se apaga y la bandeja lo muestra en gris.',
  'schedule.to': 'a',
  'schedule.from': '{day} desde',
  'schedule.until': '{day} hasta',
  'schedule.invalid': 'La hora de fin tiene que ser posterior a la de inicio.',
  'schedule.manualWins': 'El botón de Inicio siempre gana: la enciende o apaga a mano hasta la próxima hora del horario.',
  'day.0': 'Lunes',
  'day.1': 'Martes',
  'day.2': 'Miércoles',
  'day.3': 'Jueves',
  'day.4': 'Viernes',
  'day.5': 'Sábado',
  'day.6': 'Domingo',

  'settings.activity': 'Actividad',
  'settings.intervalBefore': 'Simular actividad cada',
  'settings.intervalAfter': 'minutos.',
  'settings.intervalHint': 'Teams pasa a Ausente a los 5 minutos sin actividad: con 4 alcanza.',
  'settings.how': 'Cómo',
  'method.f15': 'Tecla F15',
  'method.mouse': 'Mover el mouse 1 píxel',
  'method.f15Hint': 'F15 es una tecla que no existe en el teclado: no escribe nada ni mueve el cursor.',
  'method.mouseHint': 'Mueve el cursor un píxel y lo devuelve. Se nota si estás dibujando o arrastrando.',
  'settings.startup': 'Al iniciar',
  'settings.startWithWindows': 'Abrir con Windows, en la bandeja y sin ventana.',
  'settings.keepInTray': 'Al cerrar la ventana, seguir en la bandeja.',
  'settings.startState': 'Estado al abrir',
  'startup.off': 'Apagada',
  'startup.last': 'Como la dejé',
  'startup.schedule': 'Según el horario',
  'settings.noticesShortcut': 'Avisos y atajo',
  'settings.notify': 'Avisarme cuando se apague o se encienda sola.',
  'settings.shortcut': 'Encender y apagar con',
  'settings.shortcutBusy': 'Otro programa ya usa Ctrl+Alt+P: el atajo no está activo.',
  'settings.appearance': 'Apariencia',
  'settings.theme': 'Tema',
  'settings.language': 'Idioma',
  'theme.system': 'Sistema',
  'theme.dark': 'Oscuro',
  'theme.light': 'Claro',
  'language.system': 'Sistema',
  'language.es': 'Español',
  'language.en': 'English',

  'tray.turnOn': 'Encender',
  'tray.turnOff': 'Apagar',
  'tray.for30': 'Encender durante 30 min',
  'tray.for60': 'Encender durante 1 h',
  'tray.for120': 'Encender durante 2 h',
  'tray.untilEnd': 'Encender hasta las {time}',
  'tray.followSchedule': 'Seguir el horario',
  'tray.open': 'Abrir la ventana',
  'tray.tooltipOn': 'Jitter: encendida',
  'tray.tooltipOnUntil': 'Jitter: encendida, se apaga a las {time}',
  'tray.tooltipOff': 'Jitter: apagada',
  'tray.tooltipPaused': 'Jitter: en pausa, pantalla bloqueada',

  'toast.onTitle': 'Encendida',
  'toast.onBody': 'Simula actividad cada {minutes} minutos.',
  'toast.offTitle': 'Apagada',
  'toast.offBody': 'Windows cuenta la inactividad de forma normal.',
  'toast.trayTitle': 'Sigue en la bandeja',
  'toast.trayBody': 'Clic en el ícono para volver.',
  'toast.copied': 'Copiado',

  'notify.expiredTitle': 'Se apagó: terminó el tiempo',
  'notify.expiredBody': 'Desde ahora Windows cuenta la inactividad de forma normal.',
  'notify.scheduleOffTitle': 'Fuera del horario',
  'notify.scheduleOffBody': 'Se apagó a las {time}.',
  'notify.scheduleOnTitle': 'Dentro del horario',
  'notify.scheduleOnBody': 'Se encendió a las {time}.',
  'notify.shortcutOnTitle': 'Encendida con Ctrl+Alt+P',
  'notify.shortcutOnBody': 'Simula actividad cada {minutes} minutos hasta que la apagues.',
  'notify.shortcutOffTitle': 'Apagada con Ctrl+Alt+P',
  'notify.shortcutOffBody': 'Windows cuenta la inactividad de forma normal.',

  'welcome.title': 'Bienvenida a Jitter',
  'welcome.what': 'Jitter envía a Windows cada pocos minutos una señal de actividad, para que el equipo no pase a «Ausente» mientras lees o estás en una llamada sin tocar el teclado.',
  'welcome.how': 'Arranca apagada. Enciéndela con el botón redondo, desde la bandeja o con Ctrl+Alt+P.',
  'welcome.policy': 'En un equipo de la empresa, revisa antes su política de uso.',
  'welcome.ok': 'Entendido',

  'common.close': 'Cerrar',
  'common.copy': 'Copiar',
  'common.open': 'Abrir',
  'common.openFolder': 'Abrir la carpeta',

  'about.version': 'Versión {version}',
  'about.runsOn': 'Con qué corre',
  'about.where': 'Dónde guarda',
  'about.data': 'Datos',
  'about.logFile': 'Registro',
  'about.inWindows': 'Lo que usa de Windows',
  'about.input': 'Envío de teclas y mouse (SendInput)',
  'about.notifications': 'Avisos',
  'about.available': 'disponibles',
  'about.unavailable': 'no disponibles',
  'about.openSource': 'Código abierto incluido',
  'about.footer': '© 2026 Jhovanny Linares · Licencia MIT',
  'log.empty': 'Todavía no hay nada en el registro.'
} as const

export type TextKey = keyof typeof ES
export type Dictionary = { readonly [K in TextKey]: string }
export type Language = 'es' | 'en'

const DICTIONARIES: Record<Language, Dictionary> = { es: ES, en: EN }

/** `system` resuelve el idioma de Windows; lo que no sea español cae en inglés. */
export function resolveLanguage(preference: 'system' | Language, systemLocale: string): Language {
  if (preference !== 'system') return preference
  return systemLocale.toLowerCase().startsWith('es') ? 'es' : 'en'
}

/** Texto en el idioma pedido, con `{nombre}` reemplazado por su valor. */
export function translate(language: Language, key: TextKey, values: Record<string, string | number> = {}): string {
  const template = DICTIONARIES[language][key]
  return template.replace(/\{(\w+)\}/g, (match, name: string) => (name in values ? String(values[name]) : match))
}
