import { useEffect, useState } from 'react'
import type { Preferences } from '@shared/preferences'

export type ResolvedTheme = 'light' | 'dark'

const LIGHT_QUERY = '(prefers-color-scheme: light)'

/**
 * Tema efectivo: el elegido, o el de Windows si es «Sistema», que cambia en vivo si Windows cambia.
 * Lo aplica en `<html data-theme>`, que es lo que lee tokens.css.
 */
export function useResolvedTheme(preference: Preferences['theme']): ResolvedTheme {
  const [systemIsLight, setSystemIsLight] = useState(() => window.matchMedia(LIGHT_QUERY).matches)
  useEffect(() => {
    const query = window.matchMedia(LIGHT_QUERY)
    const update = () => setSystemIsLight(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  const theme = preference === 'system' ? (systemIsLight ? 'light' : 'dark') : preference
  useEffect(() => {
    if (theme === 'light') document.documentElement.dataset.theme = 'light'
    else document.documentElement.removeAttribute('data-theme')
  }, [theme])
  return theme
}
