; electron-builder incluye este archivo en el instalador NSIS (nsis.include por defecto: build/installer.nsh).
; Va en UTF-8 con BOM: lleva la pregunta con tildes. Copiado de Purga (patrón del skill app-nueva).

; Detalle en vivo detrás de «Mostrar detalles»: electron-builder fija «ShowInstDetails nevershow» y apaga el detalle en
; la primera línea de la sección. customCheckAppRunning es el primer punto de entrada dentro de la sección: ahí se
; enciende. electron-builder 26.17.0, templates/nsis/installSection.nsh: revisar al actualizarlo.
!macro customHeader
  ShowInstDetails hide
!macroend

; Sin esto la página de avance salta sola a «Finalizar» y la lista no se alcanza a leer.
!macro customPageAfterChangeDir
  !define MUI_FINISHPAGE_NOAUTOCLOSE
!macroend

!include "getProcessInfo.nsh"
Var pid

!macro customCheckAppRunning
  SetDetailsPrint listonly
  DetailPrint "Comprobando si Jitter está abierta para cerrarla…"
  !insertmacro IS_POWERSHELL_AVAILABLE
  !insertmacro _CHECK_APP_RUNNING
  !ifndef BUILD_UNINSTALLER
    ${If} ${FileExists} "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
      DetailPrint "Quitando la versión anterior del programa en $INSTDIR…"
      DetailPrint "  Tu configuración ($APPDATA\Jitter) no se toca."
    ${EndIf}
    DetailPrint "Extrayendo Jitter ${VERSION}…"
  !endif
!macroend

!macro customFiles_x64
  DetailPrint "Archivos de Jitter copiados en $INSTDIR"
  DetailPrint "Registrando Jitter en Aplicaciones instaladas y creando los accesos directos…"
!macroend

!macro customInstall
  DetailPrint "Tu configuración y el registro siguen en $APPDATA\Jitter"
  DetailPrint "Listo."
!macroend

; Al desinstalar se quita el inicio con Windows; el ícono de la bandeja se va con el proceso. La configuración de
; %APPDATA%\Jitter se conserva salvo que el usuario pida borrarla. En una actualización no se toca nada.
!macro customUnInstall
  ${ifNot} ${isUpdated}
    ; «Abrir con Windows»: Electron escribe el valor con el AppUserModelId de la app
    DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "com.jhovanny.jitter"
    ${If} ${Cmd} `MessageBox MB_YESNO|MB_ICONQUESTION|MB_DEFBUTTON2 "¿Borrar también tu configuración de Jitter?$\n$\nSí: se borran el horario, las preferencias y el registro ($APPDATA\Jitter).$\nNo: quedan, y una instalación nueva los vuelve a usar." /SD IDNO IDYES`
      RMDir /r "$APPDATA\Jitter"
    ${EndIf}
  ${endIf}
!macroend
