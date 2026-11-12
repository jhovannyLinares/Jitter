"""Arnés de las pruebas de pantalla de Jitter, con el patrón de Purga: Playwright por CDP.

Lanza la app ya construida (`npm run build`) con un perfil propio (JITTER_HOME y su carpeta de Electron), espera por
condición (nunca por tiempo fijo) y junta los resultados OK / FALLA.
"""
import json
import os
import subprocess
import sys
import tempfile
import time
from contextlib import contextmanager

from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'capturas')
ELECTRON = os.path.join(ROOT, 'node_modules', 'electron', 'dist', 'electron.exe')
PACKAGED = os.path.join(ROOT, 'dist', 'win-unpacked', 'Jitter.exe')
# con el argumento «pack» se prueba el empaquetado (npm run dist antes); sin él, Electron de desarrollo
IS_PACKED = 'pack' in sys.argv[1:]
APP_COMMAND = [PACKAGED] if IS_PACKED else [ELECTRON, '.']
PROCESS_NAME = 'Jitter.exe' if IS_PACKED else 'electron.exe'
# 9333 lo usa GitKraken y 9444 las pruebas de Purga
CDP_PORT = 9445
CONNECT_TIMEOUT_S = 30
WAIT_TIMEOUT_S = 20
POLL_INTERVAL_S = 0.2

results = []
# la consola de Windows usa cp1252 y las etiquetas llevan tildes y flechas
sys.stdout.reconfigure(encoding='utf-8')


def check(label, condition, detail=''):
    results.append((label, bool(condition)))
    print(('OK    ' if condition else 'FALLA ') + label + (f'  [{detail}]' if detail and not condition else ''))


def wait_until(page, expression, timeout_s=WAIT_TIMEOUT_S):
    """Espera a que la expresión sea verdadera. La CSP de la app prohíbe eval: se sondea con evaluate."""
    deadline = time.time() + timeout_s
    while not page.evaluate(f'() => Boolean({expression})'):
        if time.time() > deadline:
            raise TimeoutError(f'No se cumplió: {expression}')
        time.sleep(POLL_INTERVAL_S)


def prepare_profile(preferences):
    """Perfil nuevo en cada corrida, con las preferencias de partida (el idioma fijo, para comparar textos)."""
    home = tempfile.mkdtemp(prefix='jitter-e2e-')
    with open(os.path.join(home, 'preferences.json'), 'w', encoding='utf-8') as file:
        json.dump(preferences, file)
    return home


def isolation_args(home):
    """La carpeta de usuario de Electron decide el bloqueo de instancia única: sin esto, con Jitter abierta en el
    equipo, la app de prueba se cierra al arrancar y le pasa el control a la instancia real."""
    return [f'--user-data-dir={os.path.join(home, "electron")}']


def app_env(home):
    env = {key: value for key, value in os.environ.items() if key != 'ELECTRON_RUN_AS_NODE'}
    env['JITTER_HOME'] = home
    return env


def launch(home, extra_args=()):
    return subprocess.Popen([*APP_COMMAND, f'--remote-debugging-port={CDP_PORT}', *isolation_args(home), *extra_args], cwd=ROOT, env=app_env(home))


@contextmanager
def running_app(home):
    process = launch(home)
    try:
        with sync_playwright() as playwright:
            browser = connect(playwright)
            page = main_page(browser)
            page.app_pid = process.pid
            page.wait_for_selector('.app .view', timeout=WAIT_TIMEOUT_S * 1000)
            yield page, process
    finally:
        if process.poll() is None:
            process.kill()


def connect(playwright):
    deadline = time.time() + CONNECT_TIMEOUT_S
    while True:
        try:
            return playwright.chromium.connect_over_cdp(f'http://127.0.0.1:{CDP_PORT}')
        except Exception:
            if time.time() > deadline:
                raise
            time.sleep(POLL_INTERVAL_S)


def main_page(browser):
    deadline = time.time() + CONNECT_TIMEOUT_S
    while time.time() < deadline:
        page = next((candidate for context in browser.contexts for candidate in context.pages if 'index.html' in candidate.url), None)
        if page:
            return page
        time.sleep(POLL_INTERVAL_S)
    raise TimeoutError('La ventana principal no apareció')


def window_visible(pid):
    """Si el proceso tiene una ventana principal visible, según Windows (una ventana oculta no cuenta)."""
    handle = subprocess.run(['powershell.exe', '-NoProfile', '-Command', f'(Get-Process -Id {pid}).MainWindowHandle'], capture_output=True, text=True)
    return handle.stdout.strip() not in ('', '0')


def wait_window(pid, visible, timeout_s=WAIT_TIMEOUT_S):
    deadline = time.time() + timeout_s
    while window_visible(pid) != visible:
        if time.time() > deadline:
            raise TimeoutError(f'La ventana no quedó {"visible" if visible else "oculta"}')
        time.sleep(POLL_INTERVAL_S)


def processes_with(marker):
    """Procesos de la app cuya línea de comandos lleva el perfil de la prueba."""
    query = f"Get-CimInstance Win32_Process -Filter \"Name='{PROCESS_NAME}'\" | Where-Object {{ $_.CommandLine -like '*{marker}*' }} | Measure-Object | Select-Object -ExpandProperty Count"
    output = subprocess.run(['powershell.exe', '-NoProfile', '-Command', query], capture_output=True, text=True)
    return int(output.stdout.strip() or 0)


def wait_no_processes(marker, timeout_s=WAIT_TIMEOUT_S):
    deadline = time.time() + timeout_s
    while processes_with(marker) > 0:
        if time.time() > deadline:
            return False
        time.sleep(POLL_INTERVAL_S)
    return True


def shot(page, name):
    os.makedirs(OUT, exist_ok=True)
    page.screenshot(path=os.path.join(OUT, f'{name}.png'))


def finish():
    failed = [label for label, ok in results if not ok]
    print(f'\n{len(results) - len(failed)} OK · {len(failed)} FALLA')
    sys.exit(1 if failed else 0)
