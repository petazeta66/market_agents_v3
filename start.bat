@echo off
cd /d "%~dp0"
echo Iniciando MarketAgents...

start "Backend - MarketAgents" cmd /k "py -3.11 -W ignore -m uvicorn backend.api:app --reload --host 0.0.0.0 --port 8000"
timeout /t 3 /nobreak >nul
start "Frontend - MarketAgents" cmd /k "cd frontend && npm run dev"

echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo.
echo Cierra las ventanas de Backend y Frontend para detener el programa.
pause
