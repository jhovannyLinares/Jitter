"""Flujo entre pantallas de Jitter: qué abre cada botón o menú, el paso siguiente, qué se habilita y el cierre.
El estado, el horario, las preferencias y la señal a Windows ya los prueban los tests de vitest; aquí, el recorrido.
Uso: npm run build && python tests/e2e/flujo.py
"""
from datetime import datetime

from harness import check, finish, launch, prepare_profile, running_app, shot, wait_no_processes, wait_until, wait_window

LABEL = "document.querySelector('#power-label')?.innerText"
BADGE = "document.querySelector('#power-badge')?.innerText"


def label(page):
    return page.evaluate(f'() => {LABEL}') or ''


def within_default_schedule(now):
    """El horario de fábrica: lunes a viernes de 08:30 a 18:00."""
    minutes = now.hour * 60 + now.minute
    return now.weekday() < 5 and 8 * 60 + 30 <= minutes < 18 * 60


def first_use(page):
    page.wait_for_selector('#welcome-ok')
    check('primer uso: la bienvenida aparece', 'Bienvenida a Jitter' in page.inner_text('.dialog'))
    shot(page, 'flujo_1_bienvenida')
    page.click('#welcome-ok')
    wait_until(page, "!document.querySelector('.backdrop')")
    check('primer uso: «Entendido» la cierra y deja Inicio apagada', label(page) == 'Apagada', label(page))
    overflow = page.evaluate('() => document.documentElement.scrollWidth - document.documentElement.clientWidth')
    check('la ventana no se desplaza de lado', overflow == 0, f'{overflow} px de más')


def power(page):
    page.click('#power')
    wait_until(page, f"{LABEL} === 'Encendida'")
    check('botón: enciende, la insignia dice la próxima señal', 'próxima señal' in page.evaluate(f'() => {BADGE}'))
    check('botón: aparece el aviso «Encendida»', 'Encendida' in page.inner_text('.toast'))
    check('barra de estado: dice cada cuánto y cómo', 'cada 4 min' in page.inner_text('#status-signals'))
    page.click('[data-until="30"]')
    wait_until(page, "document.querySelector('[data-until=\"30\"]')?.classList.contains('on')")
    check('30 min: queda marcado y la ayuda cuenta para atrás', 'se apaga en' in page.inner_text('#power-hint'))
    shot(page, 'flujo_2_encendida')
    page.click('#power')
    wait_until(page, f"{LABEL} === 'Apagada'")
    check('botón: apaga', True)


def schedule(page):
    page.click('[data-view="schedule"]')
    page.wait_for_selector('#schedule-enabled')
    page.check('#schedule-enabled')
    page.click('[data-view="home"]')
    expected = 'Encendida' if within_default_schedule(datetime.now()) else 'Esperando horario'
    wait_until(page, f"{LABEL} === {expected!r}")
    check(f'horario: al activarlo se alinea con la hora ({expected})', True)
    shot(page, 'flujo_3_horario')
    page.click('[data-view="schedule"]')
    page.uncheck('#schedule-enabled')
    page.click('[data-view="home"]')
    if label(page) == 'Encendida':
        page.click('#power')
    wait_until(page, f"{LABEL} === 'Apagada'")


def settings(page):
    page.click('[data-view="settings"]')
    page.wait_for_selector('#interval')
    page.fill('#interval', '2')
    page.press('#interval', 'Enter')
    page.click('#method [data-value="mouse"]')
    wait_until(page, "document.querySelector('#method [data-value=\"mouse\"]')?.classList.contains('on')")
    check('configuración: el método cambia y explica el mouse', 'Mueve el cursor' in page.inner_text('.view'))
    page.click('#theme [data-value="light"]')
    wait_until(page, "document.documentElement.dataset.theme === 'light'")
    check('configuración: el tema claro se aplica en vivo', True)
    shot(page, 'flujo_4_configuracion')
    page.click('[data-view="home"]')
    page.click('#power')
    wait_until(page, f"{LABEL} === 'Encendida'")
    check('configuración: el intervalo nuevo se ve en la barra de estado', 'cada 2 min' in page.inner_text('#status-signals'), page.inner_text('#status-signals'))
    page.click('#power')
    page.click('[data-view="settings"]')
    page.click('#theme [data-value="dark"]')
    page.click('[data-view="home"]')


def help_menu(page):
    page.click('.menubar-title >> text="Ayuda"')
    page.click('.menubar-panel >> text="Acerca de Jitter"')
    page.wait_for_selector('.about-name')
    check('Ayuda → Acerca de: versión y dónde guarda', 'Versión 0.1.0' in page.inner_text('.dialog') and 'jitter.log' in page.inner_text('.dialog'))
    shot(page, 'flujo_5_acerca_de')
    page.click('.dialog-foot .btn')
    page.keyboard.press('F1')
    page.wait_for_selector('.dialog')
    check('F1 abre la guía de uso', 'Guía de uso' in page.inner_text('.dialog-title'))
    page.keyboard.press('Escape')
    page.click('.menubar-title >> text="Ayuda"')
    page.click('.menubar-panel >> text="Registro"')
    page.wait_for_selector('.log-lines')
    check('Ayuda → Registro: muestra lo que pasó', 'power.on' in page.inner_text('.log-lines'))
    page.keyboard.press('Escape')


def tray_and_quit(page, process, home):
    page.keyboard.press('Control+w')
    wait_window(process.pid, visible=False)
    check('Ctrl+W: la ventana se va y la app sigue en la bandeja', process.poll() is None)
    second = launch(home)
    second.wait(timeout=20)
    wait_window(process.pid, visible=True)
    check('abrirla otra vez: no hay segunda instancia, vuelve la ventana', True)
    try:
        page.evaluate('() => window.jitter.quit()')
    except Exception:
        pass  # la ventana se cierra a mitad de la llamada: es lo esperado
    process.wait(timeout=20)
    check('Salir: no queda ningún proceso de la app', wait_no_processes(home))


def main():
    home = prepare_profile({'language': 'es', 'theme': 'dark'})
    with running_app(home) as (page, process):
        first_use(page)
        power(page)
        schedule(page)
        settings(page)
        help_menu(page)
        tray_and_quit(page, process, home)
    finish()


if __name__ == '__main__':
    main()
