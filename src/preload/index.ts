import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import { EVENT_COMMAND, EVENT_PREFERENCES, EVENT_SNAPSHOT } from '@shared/events'

/** Única superficie expuesta a la interfaz: pedidos con nombre y eventos. Sin Node. */
function subscribe(channel: string, callback: (payload: unknown) => void): () => void {
  const listener = (_event: IpcRendererEvent, payload: unknown) => callback(payload)
  ipcRenderer.on(channel, listener)
  return () => {
    ipcRenderer.removeListener(channel, listener)
  }
}

const api = {
  state: () => ipcRenderer.invoke('state:get'),
  toggle: () => ipcRenderer.invoke('power:toggle'),
  turnOn: (until: string) => ipcRenderer.invoke('power:on', until),
  turnOff: () => ipcRenderer.invoke('power:off'),
  preferences: () => ipcRenderer.invoke('prefs:get'),
  setPreferences: (patch: unknown) => ipcRenderer.invoke('prefs:set', patch),
  about: () => ipcRenderer.invoke('app:about'),
  ready: () => ipcRenderer.invoke('app:ready'),
  hide: () => ipcRenderer.invoke('app:hide'),
  quit: () => ipcRenderer.invoke('app:quit'),
  openPath: (target: 'data' | 'log') => ipcRenderer.invoke('app:openPath', target),
  readLog: () => ipcRenderer.invoke('log:read'),
  onSnapshot: (callback: (snapshot: unknown) => void) => subscribe(EVENT_SNAPSHOT, callback),
  onPreferences: (callback: (preferences: unknown) => void) => subscribe(EVENT_PREFERENCES, callback),
  onCommand: (callback: (command: unknown) => void) => subscribe(EVENT_COMMAND, callback)
}

contextBridge.exposeInMainWorld('jitter', api)
