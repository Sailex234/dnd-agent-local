import logging
import secrets

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.openapi.utils import get_openapi
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel, ValidationError

from shared import config, encounters, sheets
from shared.db import client

# uvicorn solo configura sus loggers; configuramos el root para que los logs de la
# app (info y alertas) se emitan junto con los de uvicorn.
logging.basicConfig(
    level=config.LOG_LEVEL,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)

logger = logging.getLogger(__name__)

_basic_auth = HTTPBasic()


def require_auth(credentials: HTTPBasicCredentials = Depends(_basic_auth)) -> None:
    # Credencial unica compartida (ver AUTH_USER/AUTH_PASSWORD en la web). compare_digest
    # evita filtrar por timing si el usuario/contrasena es parcialmente correcto.
    valid_user = secrets.compare_digest(credentials.username, config.API_AUTH_USER)
    valid_password = secrets.compare_digest(credentials.password, config.API_AUTH_PASSWORD)
    if not (valid_user and valid_password):
        raise HTTPException(
            status_code=401,
            detail="Credenciales invalidas.",
            headers={"WWW-Authenticate": "Basic"},
        )


# docs_url/openapi_url en None: las rutas automaticas de FastAPI para /docs y
# /openapi.json se registran via Starlette add_route (no add_api_route), asi que NO
# heredan las `dependencies` a nivel app. Se registran a mano mas abajo, protegidas.
app = FastAPI(
    title="dnd-agent API",
    description="API delgada de hojas de personaje y jugadores, consumida por la web.",
    version="0.1.0",
    dependencies=[Depends(require_auth)],
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
)

# La web adjunta la credencial compartida (Authorization: Basic) en cada llamada,
# tanto server-side como client-side, asi que allow_origins=["*"] sigue siendo valido
# (no se dependen de cookies/credenciales del navegador para el CORS).
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ALLOW_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/openapi.json", include_in_schema=False)
def openapi_schema() -> dict:
    return get_openapi(title=app.title, version=app.version, description=app.description, routes=app.routes)


@app.get("/docs", include_in_schema=False)
def docs() -> object:
    return get_swagger_ui_html(openapi_url="/openapi.json", title=f"{app.title} - Swagger UI")


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/character-sheets")
def list_character_sheets() -> list[dict]:
    # API publica de solo lectura: listado de personajes por slug, sin player_id.
    return sheets.list_sheets()


@app.get("/character-sheets/{slug}")
def get_character_sheet(slug: str) -> dict:
    # Hoja publica por slug, sin player_id. Sin auth, pensada para la web.
    doc = sheets.read_sheet_by_slug(slug)
    if doc is None:
        raise HTTPException(status_code=404, detail="No existe una hoja con ese slug.")
    return doc


# --- Escritura desde la web interna (red privada, sin auth) ---


class CreateSheetRequest(BaseModel):
    user_id: str
    sheet: dict


class UpdateSheetRequest(BaseModel):
    sheet: dict


class CreatePlayerRequest(BaseModel):
    player_id: str
    nombre: str


@app.post("/character-sheets", status_code=201)
def create_character_sheet(req: CreateSheetRequest) -> dict:
    # Sin auth: superficie interna en red privada. Valida contra el schema estricto.
    # Un usuario puede tener cualquier cantidad de hojas: sin chequeo de cardinalidad.
    try:
        return sheets.create_sheet(req.user_id, req.sheet)
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=e.errors())
    except sheets.PlayerNotFound:
        raise HTTPException(status_code=422, detail="No existe un usuario con ese id.")


@app.put("/character-sheets/{slug}")
def update_character_sheet(slug: str, req: UpdateSheetRequest) -> dict:
    try:
        doc = sheets.update_sheet_by_slug(slug, req.sheet)
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=e.errors())
    if doc is None:
        raise HTTPException(status_code=404, detail="No existe una hoja con ese slug.")
    return doc


@app.get("/players")
def list_players() -> list[dict]:
    # Superficie interna: incluye id (para asociar una hoja) y player_id.
    return client.list_players()


@app.post("/players", status_code=201)
def create_player(req: CreatePlayerRequest) -> dict:
    if client.player_exists(req.player_id):
        raise HTTPException(status_code=409, detail="Ya existe un jugador con ese id.")
    client.insert_user(req.player_id, req.nombre)
    return {"player_id": req.player_id, "nombre": req.nombre}


# --- Rastreador de combate (red privada, sin auth extra: ya cubierto por require_auth) ---


class CreateEncounterRequest(BaseModel):
    nombre: str


class UpdateEncounterRequest(BaseModel):
    encounter: dict


@app.get("/encounters")
def list_encounters() -> list[dict]:
    return encounters.list_encounters()


@app.post("/encounters", status_code=201)
def create_encounter(req: CreateEncounterRequest) -> dict:
    return encounters.create_encounter(req.nombre)


@app.get("/encounters/{encounter_id}")
def get_encounter(encounter_id: str) -> dict:
    doc = encounters.get_encounter(encounter_id)
    if doc is None:
        raise HTTPException(status_code=404, detail="No existe un encuentro con ese id.")
    return doc


@app.put("/encounters/{encounter_id}")
def update_encounter(encounter_id: str, req: UpdateEncounterRequest) -> dict:
    try:
        doc = encounters.update_encounter(encounter_id, req.encounter)
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=e.errors())
    if doc is None:
        raise HTTPException(status_code=404, detail="No existe un encuentro con ese id.")
    return doc


@app.delete("/encounters/{encounter_id}", status_code=204)
def delete_encounter(encounter_id: str) -> None:
    if not encounters.delete_encounter(encounter_id):
        raise HTTPException(status_code=404, detail="No existe un encuentro con ese id.")
