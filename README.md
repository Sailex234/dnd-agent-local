# dnd-agent

Sistema local para una mesa de D&D 2024: hojas de personaje digitales,
referencia rapida del corpus de reglas (monstruos, glosario, dificultad de
encuentros, botin) y un rastreador de combate/iniciativa. Todo corre en la
red local, sin depender de ninguna API externa ni LLM (ver `GUIA_DM.md` para
el uso desde la mesa, o `INSTALACION.md` para instalarlo en otra PC).

El sistema es un monorepo (`apps/`) con dos procesos separados: una API HTTP
delgada para la web y la web en si. Todos corren localmente (sin deploy ni
contenedores propios); Mongo corre en Docker via `docker-compose.yml`.

## Estructura

```
apps/
  shared/               paquete Python compartido (config, Mongo, schema de hojas/encuentros)
    shared/config.py    configuracion (constantes + lo poco que sale de .env)
    shared/db/          client.py: conexion Mongo (jugadores, hojas, pendientes, encuentros)
    shared/sheets.py     schema estricto (Pydantic) y CRUD de hojas de personaje
    shared/encounters.py  schema estricto (Pydantic) y CRUD del rastreador de combate
  api/                  FastAPI delgada: endpoints para la web + Mongo
    main.py             /health, /character-sheets, /players, /encounters
    seed_sheets.py       script de alta inicial de jugadores/hojas
  web/                  Next.js (App Router), consume la api publica
    app/referencia/     paginas de consulta instantanea (monstruos, glosario, encuentros, botin)
    app/combate/        rastreador de iniciativa/combate
    data/                JSON generado por scripts/build_reference_data.py
corpus/                 manuales 2024 en markdown, fuente de las paginas de referencia
  manual-jugador/       Manual del Jugador 2024
  guia-dm/               Guia del Dungeon Master 2024
  manual-monstruos/      Manual de Monstruos 2024 (bestiario A-Z + apendices)
scripts/
  build_reference_data.py  parsea el corpus a apps/web/data/*.json (sin LLM)
docker-compose.yml        Mongo, para desarrollo/uso local
```

`apps/shared` es la unica fuente de verdad del schema de hojas/encuentros y
del acceso a Mongo; `apps/api` lo declara como dependencia local (`uv`,
paquete instalable).

### Datos de referencia

`apps/web/data/*.json` (monstruos, glosario, tablas de botin, nombres de PNJ)
son un artefacto derivado del corpus (los `.md` siguen siendo la fuente de
verdad), generado con:

```bash
python3 scripts/build_reference_data.py
# o: make build-reference-data
```

Correr tras cualquier cambio al corpus del Manual de monstruos o la Guia del
DM. No requiere ningun paquete de terceros ni conectividad: es texto plano
parseado con expresiones regulares.

## Requisitos

- Python 3.12 (manejado con [uv](https://docs.astral.sh/uv/))
- Node 20+ (para `apps/web`)
- Docker + Docker Compose (para Mongo)
- El corpus en `corpus/` (incluido en el repo)

## Setup

```bash
# 1. Contenedor de Mongo
docker compose up -d

# 2. Dependencias de cada app Python (crea su .venv local)
uv sync --project apps/shared
uv sync --project apps/api

# 3. Variables de entorno
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# 4. Datos de referencia (monstruos, glosario, botin, PNJ)
python3 scripts/build_reference_data.py
```

## Uso local

```bash
make api        # o: make db && uv run --directory apps/api uvicorn main:app --host 0.0.0.0 --port 8000
make web         # frontend Next.js
```

La API (`apps/api`) expone `GET /health`, `GET /character-sheets` (listado),
`GET /character-sheets/{slug}` (hoja por slug), `GET/POST/PUT /encounters`
(rastreador de combate) y las rutas de escritura de la web interna
(`POST/PUT /character-sheets`, `GET/POST /players`), todas detras de HTTP
Basic Auth (`API_AUTH_USER`/`API_AUTH_PASSWORD`).

`APP_ENV_FILE` (leido por `apps/shared/shared/config.py`) permite elegir que
archivo de entorno carga el proceso; default `.env`.

## Hojas de personaje

Cada jugador tiene una hoja de personaje en la coleccion `character_sheets` de MongoDB, un documento por jugador con `user_id` (referencia al jugador dueño), `nombre`, `updated_at` y `sheet` (la hoja en si). El `sheet` cumple un schema estricto y tipado (Pydantic con `extra="forbid"`, definido en `apps/shared/shared/sheets.py`) con la terminologia del Manual del Jugador 2024 en espanol: identidad, las seis caracteristicas, competencias, combate, rasgos, dotes, equipo y conjuros (opcional). Se guardan los valores base; los derivados (modificador de caracteristica, totales de salvaciones/habilidades) se calculan, no se persisten.

### Alta de hojas

El alta inicial se hace a mano. Hay un seed de ejemplo en `apps/api/seed_sheets.py` que valida contra el schema antes de insertar:

```bash
uv run --directory apps/api python seed_sheets.py
```

Para editar a mano directamente en Mongo (`mongosh` o Compass):

```js
// mongosh
use dnd_agent
db.players.find()
db.character_sheets.find()
```

### API publica de hojas

Pensada para una web sin login, dos endpoints de solo lectura que **no exponen el id del jugador**:

- `GET /character-sheets` devuelve el listado de personajes como `[{nombre, slug}]`.
- `GET /character-sheets/{slug}` devuelve la hoja del personaje (`{nombre, slug, sheet, updated_at}`, 200) o 404 si no existe.

El `slug` se deriva de forma estable del nombre del personaje (minusculas, sin acentos, guiones); ante nombres iguales se desempata con un sufijo numerico.

### Endpoints de escritura

Para que la web pueda crear/editar hojas y dar de alta jugadores hay endpoints de escritura. Validan la hoja contra el mismo schema estricto antes de persistir.

- `POST /character-sheets` (`{user_id, sheet}`): crea la hoja de un jugador dado de alta. 409 si ya tiene hoja, 422 si la `sheet` no valida.
- `PUT /character-sheets/{slug}` (`{sheet}`): actualiza la hoja existente. 404 si el slug no existe, 422 si no valida.
- `GET /players`: listado de jugadores con `player_id` y `nombre` (superficie **interna**: a diferencia de la API publica de hojas, SI incluye el id del jugador, porque crear una hoja lo requiere).
- `POST /players` (`{player_id, nombre}`): alta de jugador en `players`. 409 si el `player_id` ya existe.

> Todos los endpoints (incluidos los de lectura publica) exigen HTTP Basic Auth (`API_AUTH_USER`/`API_AUTH_PASSWORD`), que debe coincidir con `AUTH_USER`/`AUTH_PASSWORD` de `apps/web`.

## Rastreador de combate

Cada encuentro es un documento en la coleccion `encounters` de MongoDB
(schema estricto en `apps/shared/shared/encounters.py`): nombre, lista de
combatientes (PJ o monstruo, con CA/PG/iniciativa/condiciones) y el puntero
de ronda/turno actual.

- `GET /encounters` / `POST /encounters` (`{nombre}`): listado y alta.
- `GET /encounters/{id}` / `PUT /encounters/{id}` (`{encounter}`): lectura y
  reemplazo completo del estado (combatientes, ronda y turno actuales).
- `DELETE /encounters/{id}`: borrado.

La web (`/combate`) trae PJs desde `/character-sheets` y monstruos desde
`apps/web/data/monstruos.json` (via una ruta interna de Next.js,
`/api/monstruos`) para no tener que tipear stats a mano.

## Web (Next.js)

`apps/web` es un frontend Next.js (App Router) que consume la API. Tiene su propio login (cookie, credencial compartida) que reenvia como Basic Auth a la API. Para correrlo en local:

```bash
cd apps/web
cp .env.example .env.local   # NEXT_PUBLIC_API_BASE_URL, AUTH_USER, AUTH_PASSWORD
npm install
npm run dev                  # http://localhost:3000
```

- `/` lista los personajes y cada uno enlaza a su hoja en `/<slug>` (layout estilo Manual del Jugador 2024; los valores derivados se calculan en el cliente a partir de los valores base).
- `/jugadores/nuevo`: cargar un jugador (id de jugador + nombre).
- `/referencia`: monstruos, glosario, dificultad de encuentros y botin (ver arriba).
- `/combate`: rastreador de iniciativa (ver arriba).

`NEXT_PUBLIC_API_BASE_URL` se hornea en el bundle en build-time (lo usan tanto el render server-side como las mutaciones client-side): no es una env var de runtime.
