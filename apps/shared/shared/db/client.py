from functools import lru_cache

from bson import ObjectId
from bson.errors import InvalidId
from pymongo import MongoClient
from pymongo.collection import Collection

from .. import config


@lru_cache(maxsize=1)
def _users() -> Collection:
    # serverSelectionTimeoutMS corto: si Mongo no responde, fallamos rapido en vez
    # de colgar el arranque del proceso 30s (el default de pymongo).
    client = MongoClient(config.MONGO_URI, serverSelectionTimeoutMS=5000)
    return client[config.MONGO_DB]["players"]


def list_users() -> list[dict]:
    # player_id se guarda como string, unico por jugador. `id` es el _id de Mongo
    # como string: identidad propia del usuario, referenciada por
    # character_sheets.user_id (el player_id queda solo como atributo de auth).
    out = []
    for u in _users().find({}).sort("nombre", 1):
        u["id"] = str(u.pop("_id"))
        out.append(u)
    return out


def list_players() -> list[dict]:
    # Listado para la web interna (red privada): incluye id y player_id, necesarios
    # para asociarle una hoja a un usuario.
    return [
        {"id": u["id"], "player_id": u["player_id"], "nombre": u.get("nombre", "")}
        for u in list_users()
    ]


def get_user_by_player_id(player_id: str) -> dict | None:
    """Resuelve un usuario por su player_id (unico), o None si no esta dado de alta."""
    doc = _users().find_one({"player_id": player_id})
    if doc is None:
        return None
    doc["id"] = str(doc.pop("_id"))
    return doc


def get_user(user_id: str) -> dict | None:
    """Resuelve un usuario por su id (str del _id de Mongo), o None si no existe o el
    id no es un ObjectId valido."""
    try:
        oid = ObjectId(user_id)
    except (InvalidId, TypeError):
        return None
    doc = _users().find_one({"_id": oid})
    if doc is None:
        return None
    doc["id"] = str(doc.pop("_id"))
    return doc


def player_exists(player_id: str) -> bool:
    return _users().find_one({"player_id": player_id}, {"_id": 1}) is not None


def insert_user(player_id: str, nombre: str) -> None:
    # player_id como string, consistente con el resto del codigo.
    _users().insert_one({"player_id": player_id, "nombre": nombre})


def players_collection() -> Collection:
    return _users()


@lru_cache(maxsize=1)
def _character_sheets() -> Collection:
    client = MongoClient(config.MONGO_URI, serverSelectionTimeoutMS=5000)
    coll = client[config.MONGO_DB]["character_sheets"]
    # user_id no-unico: un usuario puede tener 0 a N hojas (varios personajes).
    coll.create_index([("user_id", 1)])
    return coll


def character_sheets() -> Collection:
    return _character_sheets()


@lru_cache(maxsize=1)
def _pending_sheet_changes() -> Collection:
    client = MongoClient(config.MONGO_URI, serverSelectionTimeoutMS=5000)
    coll = client[config.MONGO_DB]["pending_sheet_changes"]
    # Una propuesta pendiente por hoja a la vez: sheet_id unico (upsert la reemplaza).
    # No es por user_id: un usuario con varias hojas puede tener una pendiente
    # independiente por cada una, sin que proponer un cambio en una pise la de otra.
    coll.create_index([("sheet_id", 1)], unique=True)
    return coll


def pending_sheet_changes() -> Collection:
    return _pending_sheet_changes()


@lru_cache(maxsize=1)
def _encounters() -> Collection:
    client = MongoClient(config.MONGO_URI, serverSelectionTimeoutMS=5000)
    return client[config.MONGO_DB]["encounters"]


def encounters() -> Collection:
    return _encounters()
