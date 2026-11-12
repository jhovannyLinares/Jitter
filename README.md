# Jitter

Jitter keeps your status active while you work. It lives in the Windows tray and, every few minutes, sends Windows a harmless activity signal so apps such as Teams do not switch you to «Away».

**Version:** 0.1.0

## What it does

| Feature | How |
|---|---|
| Turn on / off | Round button on Home, left click on the tray icon, or `Ctrl+Alt+P` from any program |
| For a while | 30 min, 1 h, 2 h or «Until 18:00» (the end of today's schedule); turns off by itself and notifies |
| Schedule | Days and hours (default Mon–Fri 08:30–18:00); turns on and off by itself at each boundary; the button wins until the next boundary |
| Signal | Every 1–14 minutes (default 4). **F15 key** (no keyboard has it: types nothing) or **1-pixel mouse move** and back |
| Locked screen | Pauses while the session is locked (Windows shows Away anyway) and resumes on unlock |
| On start | Off, as I left it, or by schedule. Optional start with Windows, straight to the tray |
| Tray | Green dot when on, grey when off; menu with the timers, «Follow the schedule», Open and Quit |
| Help | User guide (F1), Good to know, Release notes, Log, About |
| Languages / themes | Spanish and English; dark and light; both follow Windows by default |

Data lives in `%APPDATA%\Jitter` (`preferences.json`, `logs\jitter.log`). `JITTER_HOME` moves it elsewhere (tests); `JITTER_DEBUG=1` logs every signal.

> Simulating activity on a company computer may go against its usage policy. Check it first.

## Install

Windows 10/11 x64. Run `Jitter Setup 0.1.0.exe`: per-user install in `%LOCALAPPDATA%\Programs\Jitter`, no administrator rights, desktop and Start menu shortcuts. The installer is not signed: SmartScreen shows «Windows protected your PC» → **More info** → **Run anyway**. Uninstalling removes the start-with-Windows entry and asks before deleting your settings.

## Build from source

| Command | What it does |
|---|---|
| `npm install` | Dependencies (Node 24) |
| `npm run dev` | Run with hot reload |
| `npm run typecheck` | TypeScript, main and interface |
| `npm test` | Logic (vitest): schedule, state, controller, preferences, and the real SendInput signal |
| `npm run e2e` | Screen flow with Playwright over CDP (Python), against the development build |
| `npm run e2e:pack` | Same flow against the packaged app |
| `npm run dist` | Installer in `dist\` |
| `npm run icon` | Icons from `resources/logo.svg` |
| `npm run familia` | Copies the family stylesheet from the `maqueta-app` skill |

## Architecture

```
renderer (React)  ──ipc──▶  main ──▶ ActivityController ──▶ SendInput (user32, koffi)
   views, dialogs           window, tray,     state, timer,
                            shortcut, power   schedule, notices
                            monitor, prefs
```

| Folder | Responsibility |
|---|---|
| `src/shared` | Pure logic and contracts: schedule, activity state, preferences (zod), texts (es/en), help |
| `src/main` | Electron: window, tray, global shortcut, lock detection, preferences on disk, log, Windows input |
| `src/preload` | The only surface exposed to the interface (`window.jitter`) |
| `src/renderer` | Home, Schedule, Settings, Help dialogs; the family design plus `tokens.css` |
| `tests` | `unit`, `integration` (vitest) and `e2e` (Python + Playwright) |
| `docs/maqueta` | Mock-up template and generated page |

## Security

`contextIsolation`, `sandbox`, no Node in the interface, strict CSP, no navigation or new windows, every permission denied. IPC only answers the app's own page and validates every payload with zod. Only two paths can be opened from the interface (data folder and log), never one it sends. Electron fuses: no `RUN_AS_NODE`, no `NODE_OPTIONS`, no inspect arguments, asar integrity, app loaded only from the asar. The log never stores personal data.
