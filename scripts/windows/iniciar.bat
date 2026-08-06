@echo off
cd /d "%~dp0..\.."

echo Levantando Mongo (Docker)...
docker compose up -d db

echo Levantando la API...
start "dnd-agent API" cmd /k "uv run --directory apps\api uvicorn main:app --host 127.0.0.1 --port 8000"

echo Levantando la web...
start "dnd-agent Web" cmd /k "cd apps\web && npm run dev -- --port 3000"

echo Esperando que arranque todo...
timeout /t 8 /nobreak >nul

start http://localhost:3000
