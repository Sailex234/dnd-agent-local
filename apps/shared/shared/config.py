import os
from pathlib import Path

from dotenv import load_dotenv

# override=True: el .env del proceso que arranca (api, via CWD) es la fuente de verdad
# y gana sobre variables heredadas del shell. Cada app corre con su propio CWD (uv run
# --directory apps/<app>), asi que Path.cwd()/".env" resuelve al .env de esa app.
# APP_ENV_FILE permite apuntar a un archivo alternativo (ej. .env.vps para pegarle a la
# mongo deployada).
load_dotenv(Path.cwd() / os.getenv("APP_ENV_FILE", ".env"), override=True)


def _find_repo_root(start: Path) -> Path:
    """Localiza la raiz del repo buscando el marcador (corpus/ + apps/), en vez de
    asumir una profundidad fija de path (que se rompe si el layout cambia)."""
    for candidate in (start, *start.parents):
        if (candidate / "corpus").is_dir() and (candidate / "apps").is_dir():
            return candidate
    raise RuntimeError(
        "No se pudo localizar la raiz del repo (se esperaba corpus/ y apps/ desde "
        f"{start})."
    )


PROJECT_ROOT = _find_repo_root(Path(__file__).resolve())

# Corpus de markdown curado (manuales 2024): fuente de las paginas de referencia de
# apps/web y de scripts/build_reference_data.py.
CORPUS_DIR = PROJECT_ROOT / "corpus"

API_HOST = "0.0.0.0"
API_PORT = 8000
LOG_LEVEL = "INFO"

# CORS para la web interna: origenes permitidos para las llamadas client-side del
# navegador (alta/edicion de hojas y jugadores). Lista separada por comas; default "*"
# porque la superficie de escritura es de red privada y no usa cookies/credenciales.
CORS_ALLOW_ORIGINS = [
    x for x in os.getenv("CORS_ALLOW_ORIGINS", "*").replace(" ", "").split(",") if x
] or ["*"]

# Credencial unica compartida (HTTP Basic) que exige toda la API. Debe coincidir con
# AUTH_USER/AUTH_PASSWORD de apps/web.
API_AUTH_USER = os.getenv("API_AUTH_USER", "")
API_AUTH_PASSWORD = os.getenv("API_AUTH_PASSWORD", "")

# MongoDB: guarda los jugadores (coleccion players), las hojas de personaje
# (character_sheets) y las propuestas de cambio pendientes (pending_sheet_changes).
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB = os.getenv("MONGO_DB", "dnd_agent")
