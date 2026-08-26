@echo off
REM One-click launcher for the real Able AI app (Next.js frontend + FastAPI backend).
REM Double-click this file. It opens two terminal windows (backend, frontend) and
REM then opens http://localhost:3000 in your default browser once both are up.
REM Close the two terminal windows to stop the servers.

cd /d "%~dp0backend"
start "Able AI Backend" cmd /k ".venv\Scripts\python.exe -m uvicorn main:app --reload"

cd /d "%~dp0frontend"
start "Able AI Frontend" cmd /k "npm run dev"

echo Waiting for servers to start...
timeout /t 8 /nobreak >nul

start "" "http://localhost:3000"
