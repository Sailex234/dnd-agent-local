## Approach
- Read existing files before writing. Don't re-read unless changed.
- Thorough in reasoning, concise in output.
- Skip files over 100KB unless required.
- No sycophantic openers or closing fluff.
- No emojis or em-dashes.
- Do not guess APIs, versions, flags, commit SHAs, or package names. Verify by reading code or docs before asserting.

## Output
- Return code first. Explanation after, only if non-obvious.
- No inline prose. Use comments sparingly - only where logic is unclear.
- No boilerplate unless explicitly requested.

## Code Rules
- Simplest working solution. No over-engineering.
- No abstractions for single-use operations.
- No speculative features or "you might also want..."
- Read the file before modifying it. Never edit blind.
- No docstrings or type annotations on code not being changed.
- No error handling for scenarios that cannot happen.
- Three similar lines is better than a premature abstraction.

## Review Rules
- State the bug. Show the fix. Stop.
- No suggestions beyond the scope of the review.
- No compliments on the code before or after the review.

## Debugging Rules
- Never speculate about a bug without reading the relevant code first.
- State what you found, where, and the fix. One pass.
- If cause is unclear: say so. Do not guess.

## Simple Formatting
- No em dashes, smart quotes, or decorative Unicode symbols.
- Plain hyphens and straight quotes only.
- Natural language characters (accented letters, CJK, etc.) are fine when the content requires them.
- Code output must be copy-paste safe.

## Deployment (en progreso, iniciado 2026-08-13)
Objetivo: sacar la app de "todo local con Docker Desktop + VSCode" a algo que el DM
abra en un link, sin infra a cargo. Elegido: todo gratis, sin dominio propio
(subdominios de cada proveedor alcanzan).

Plan (orden obligatorio, cada paso depende del anterior):
1. MongoDB Atlas, cluster M0 free. Usuario de DB + Network Access 0.0.0.0/0 (app
   chica de mesa, no justifica restringir IP). Restaurar datos con el backup en
   `.backups/` (`mongorestore --archive=<archivo> --uri="<connection string>"`).
2. Render, deploy por Blueprint leyendo `render.yaml` (ya en el repo, commit
   3d32350). Variables sensibles (`MONGO_URI`, `MONGO_DB`, `API_AUTH_USER`,
   `API_AUTH_PASSWORD`) quedan `sync: false` a proposito (repo es publico) y se
   cargan a mano en el dashboard de Render.
3. Vercel, importar el repo con Root Directory `apps/web`. Env vars:
   `NEXT_PUBLIC_API_BASE_URL` (URL de Render del paso 2), `AUTH_USER`,
   `AUTH_PASSWORD`.

Credenciales (basic auth, deben coincidir entre api y web): ver
`apps/api/.env` y `apps/web/.env.local` (locales, gitignored, no en el repo).

Estado al 2026-08-14:
- Paso 1 (Atlas) completo: cluster `dnd-agent` M0 creado, usuario de DB
  creado en el dashboard de Atlas, Network Access 0.0.0.0/0. Backup restaurado
  (`.backups/dnd_agent_20260813_173942.archive`, 7 documentos, 4 colecciones).
  Se borro `telegram_users` del restore (vestigio de antes de migrar a
  telegram-free, quedo vacia). MONGO_URI y MONGO_DB: ver Render dashboard
  (env vars `sync: false`) o `apps/api/.env` local.
- Paso 2 (Render) en curso: Blueprint `dnd-agent-blueprint` creado apuntando a
  `Sailex234/dnd-agent-local`, servicio `dnd-agent-api` con las 4 env vars
  sensibles cargadas a mano. Primer deploy quedo live pero Render devolvia 404
  ("x-render-routing: no-server") porque el healthcheck por defecto pega a `/`
  (sin ruta) y no rutea trafico a una instancia que considera unhealthy. Fix
  commiteado y pusheado (b41d41c): `/health` ahora se registra via Starlette
  `add_route` (bypassea el auth a nivel app) y `render.yaml` tiene
  `healthCheckPath: /health`. El redeploy automatico (blueprint auto-sync) se
  colgo en el build (justo despues del warning de `uv`, antes de "Building
  shared") — no vinculado al fix de codigo, parece cuelgue puntual de Render.
  Cancelado manualmente; quedo pendiente correr "Clear build cache & deploy".
  Verificar cuando corra: `curl https://dnd-agent-api.onrender.com/health` debe
  dar 200 `{"status":"ok"}` SIN auth (es publico a proposito).
- Paso 2 (Render) verificado end-to-end: `/health` da 200 sin auth,
  `/character-sheets` (con auth) devuelve los 3 personajes restaurados. Andando.
- Paso 3 (Vercel) completo: proyecto `dnd-agent-local` importado bajo el team
  "Fachas", Root Directory `apps/web`, env vars cargadas
  (`NEXT_PUBLIC_API_BASE_URL=https://dnd-agent-api.onrender.com`,
  `AUTH_USER`, `AUTH_PASSWORD` - ver `apps/web/.env.local`). Deploy exitoso, verificado
  end-to-end: `https://dnd-agent-local.vercel.app` carga, pide basic auth y
  conecta bien con la API de Render.
- Deployment completo (2026-08-15): Atlas + Render + Vercel, los tres pasos
  verificados end-to-end. Sin infra a cargo, sin dominio propio.
- La extension de Chrome estuvo desconectada en toda esta sesion y en la
  anterior (no se pudo diagnosticar por que); todo se hizo guiando al usuario
  a mano sobre screenshots que el pegaba en el chat.