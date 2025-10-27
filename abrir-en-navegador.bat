@echo off
echo 🚀 Abriendo Abratecnica en el navegador...
echo.
echo ⚠️  IMPORTANTE: Los archivos se abrirán directamente sin servidor local.
echo    Algunas funciones avanzadas pueden no funcionar completamente.
echo.

REM Abre los archivos principales en el navegador predeterminado
echo 🏠 Abriendo página principal...
start "" "index.html"

timeout /t 2 >nul

echo 🛍️  Abriendo tienda...
start "" "tienda.html"

timeout /t 2 >nul

echo 📦 Abriendo productos...
start "" "productos.html"

echo.
echo ✅ Archivos abiertos en el navegador!
echo.
echo 💡 NOTA: Para funcionalidad completa, instala una de estas opciones:
echo    - Python: https://python.org (más fácil)
echo    - Node.js: https://nodejs.org
echo.
pause