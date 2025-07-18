@echo off
REM Script per iniciar l'aplicació amb Docker Compose (Windows)

echo 🐳 Iniciant Dashboard d'Assoliments amb Docker...

REM Verificar si Docker està instal·lat
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker no està instal·lat. Si us plau, instal·la Docker primer.
    pause
    exit /b 1
)

REM Verificar si Docker Compose està instal·lat
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose no està instal·lat. Si us plau, instal·la Docker Compose primer.
    pause
    exit /b 1
)

REM Aturar i eliminar contenedors existents
echo 🛑 Aturant contenedors existents...
docker-compose down

REM Construir i iniciar els contenedors
echo 🔨 Construint i iniciant contenedors...
docker-compose up --build -d

REM Esperar que els serveis estiguin preparats
echo ⏳ Esperant que els serveis estiguin preparats...
timeout /t 10 /nobreak >nul

REM Verificar l'estat dels contenedors
echo 📊 Estat dels contenedors:
docker-compose ps

REM Mostrar logs
echo 📋 Logs de l'aplicació:
docker-compose logs app

echo.
echo ✅ Dashboard d'Assoliments iniciat correctament!
echo 🌐 Accedeix a: http://localhost:3000
echo 🔧 Per veure els logs: docker-compose logs -f
echo 🛑 Per aturar: docker-compose down
pause 