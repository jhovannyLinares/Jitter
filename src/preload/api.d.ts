import type { Snapshot, UntilChoice } from '@shared/activity-state'
import type { InterfaceCommand } from '@shared/events'
import type { AboutInfo } from '@shared/ipc'
import type { Preferences, PreferencesPatch } from '@shared/preferences'

/** Lo que el preload expone en `window.jitter` (src/preload/index.ts). */
declare global {
  interface Window {
    jitter: {
      state: () => Promise<Snapshot>
      toggle: () => Promise<void>
      turnOn: (until: UntilChoice) => Promise<void>
      turnOff: () => Promise<void>
      preferences: () => Promise<Preferences>
      setPreferences: (patch: PreferencesPatch) => Promise<Preferences>
      about: () => Promise<AboutInfo>
      ready: () => Promise<void>
      hide: () => Promise<void>
      quit: () => Promise<void>
      openPath: (target: 'data' | 'log') => Promise<boolean>
      readLog: () => Promise<string[]>
      onSnapshot: (callback: (snapshot: Snapshot) => void) => () => void
      onPreferences: (callback: (preferences: Preferences) => void) => () => void
      onCommand: (callback: (command: InterfaceCommand) => void) => () => void
    }
  }
}

export {}
