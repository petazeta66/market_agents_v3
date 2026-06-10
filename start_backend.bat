@echo off
cd /d "%~dp0"
echo Iniciando backend FastAPI...
py -3.11 -W ignore -m uvicorn backend.api:app --reload --host 0.0.0.0 --port 8000
pause
