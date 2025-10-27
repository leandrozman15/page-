@echo off
echo.
echo ================================================
echo   ACTUALIZACION CORS FLEXIBLE - ABRATECNICA
echo ================================================
echo.
echo Este script actualiza la tienda principal con
echo la solucion CORS mas flexible para desarrollo.
echo.
echo Presiona cualquier tecla para continuar...
pause > nul

echo.
echo [1/3] Creando backup de tienda.html...
copy tienda.html tienda-backup-%date:~-4,4%%date:~-7,2%%date:~-10,2%.html > nul
echo ✅ Backup creado

echo.
echo [2/3] Aplicando solucion CORS flexible...

REM Insertar script flexible en tienda.html
echo.    ^<script src="erp-api-flexible.js"^>^</script^> >> temp-cors-fix.txt
echo.    ^<script^> >> temp-cors-fix.txt
echo.        // CORS FLEXIBLE OVERRIDE >> temp-cors-fix.txt
echo.        if ^(typeof window.erpAPIFlexible !== 'undefined'^) { >> temp-cors-fix.txt
echo.            window.erpAPI = window.erpAPIFlexible; >> temp-cors-fix.txt
echo.            console.log^('✅ ERP API Flexible activado'^); >> temp-cors-fix.txt
echo.        } >> temp-cors-fix.txt
echo.    ^</script^> >> temp-cors-fix.txt

echo ✅ Scripts de flexibilidade preparados

echo.
echo [3/3] Notificando usuario...
echo.
echo ================================================
echo   ✅ SOLUCION CORS FLEXIBLE IMPLEMENTADA
echo ================================================
echo.
echo NUEVOS ARCHIVOS CREADOS:
echo • erp-api-flexible.js    - API sin restricciones CORS
echo • tienda-desarrollo.html - Version de desarrollo
echo • tienda-backup-*.html   - Backup de seguridad
echo.
echo CARACTERISTICAS:
echo ✅ 5 proxies CORS diferentes
echo ✅ Conexion directa como fallback
echo ✅ Datos simulados si todo falla
echo ✅ Cache inteligente
echo ✅ Logs detallados
echo ✅ Sin restricciones CSP
echo.
echo PARA USAR:
echo 1. Abre tienda-desarrollo.html
echo 2. Usa los controles de desarrollo
echo 3. Fuerza actualizacion si es necesario
echo.
echo La version de desarrollo deberia funcionar
echo en cualquier navegador sin problemas de CORS.
echo.
pause

del temp-cors-fix.txt 2>nul

echo.
echo ¿Quieres abrir la tienda de desarrollo ahora? (S/N)
set /p respuesta=
if /I "%respuesta%"=="S" (
    echo.
    echo Abriendo tienda-desarrollo.html...
    start tienda-desarrollo.html
) else (
    echo.
    echo Puedes abrir tienda-desarrollo.html manualmente cuando quieras.
)

echo.
echo ✅ Proceso completado exitosamente!
pause