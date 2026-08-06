@echo off
cd /d "%~dp0..\.."

echo Parando Mongo (Docker)...
docker compose stop db

echo Listo. Cerra a mano las dos ventanas "dnd-agent API" y "dnd-agent Web" si siguen abiertas.
pause
