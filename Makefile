.DEFAULT_GOAL := api

HOST ?= 127.0.0.1
PORT ?= 8000

WEB_PORT ?= 3000

.PHONY: api db web build-reference-data deploy

# Levanta Mongo (Docker) y la api (FastAPI) en el host (foreground, Ctrl+C para frenar).
# env -u VIRTUAL_ENV: ignora un venv viejo activado en el shell; uv usa apps/api/.venv.
api: db
	env -u VIRTUAL_ENV uv run --directory apps/api uvicorn main:app --host $(HOST) --port $(PORT)

# Regenera apps/web/data/*.json (monstruos, glosario, botin, nombres de PNJ) a
# partir del corpus. Solo python3 estandar, sin LLM. Correr tras cambios al
# corpus del Manual de monstruos o la Guia del DM.
build-reference-data:
	python3 scripts/build_reference_data.py

# Levanta solo Mongo (Docker), con el puerto publicado al host.
db:
	docker compose up -d db

# Levanta el frontend Next.js (apps/web/) en el host (foreground, Ctrl+C para frenar).
# Consume la api publica; correr `make api` en otra terminal. Instala deps si faltan.
web:
	cd apps/web && [ -d node_modules ] || npm install
	cd apps/web && npm run dev -- --port $(WEB_PORT)

# Correr en la VPS (no en local): trae el ultimo commit, reinstala dependencias
# (--reinstall-package shared porque el path dependency no es editable, ver README),
# rebuildea la web y reinicia los servicios systemd dnd-api/dnd-web.
deploy:
	git pull
	uv sync --project apps/shared
	uv sync --project apps/api --reinstall-package shared
	cd apps/web && npm install && npm run build
	sudo systemctl restart dnd-api dnd-web
	sudo systemctl status dnd-api dnd-web --no-pager
