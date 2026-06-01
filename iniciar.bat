@echo off
echo Iniciando AUBASA Capacitaciones...
cd /d "%~dp0backend"
start "Backend Capacitaciones" cmd /k "node server.js"
cd /d "%~dp0frontend"
start "Frontend Capacitaciones" cmd /k "npm run dev"
echo Listo! Abriendo en http://localhost:5174
timeout /t 3
start http://localhost:5174
