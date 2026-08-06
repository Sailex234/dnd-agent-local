from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from pydantic import BaseModel, ConfigDict, Field

from .db import client


class _Strict(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Combatiente(_Strict):
    nombre: str
    tipo: str  # "pj" o "monstruo"
    iniciativa: int = 0
    ca: int = 10
    pg_max: int = 0
    pg_actuales: int = 0
    condiciones: list[str] = Field(default_factory=list)
    notas: str | None = None


class Encounter(_Strict):
    nombre: str
    combatientes: list[Combatiente] = Field(default_factory=list)
    ronda_actual: int = Field(default=1, ge=1)
    turno_actual: int = Field(default=0, ge=0)


def _public(doc: dict) -> dict:
    doc = dict(doc)
    doc["id"] = str(doc.pop("_id"))
    return doc


def list_encounters() -> list[dict]:
    out = []
    for doc in client.encounters().find({}).sort("updated_at", -1):
        d = _public(doc)
        out.append({"id": d["id"], "nombre": d["nombre"], "updated_at": d.get("updated_at")})
    return out


def get_encounter(encounter_id: str) -> dict | None:
    try:
        oid = ObjectId(encounter_id)
    except (InvalidId, TypeError):
        return None
    doc = client.encounters().find_one({"_id": oid})
    return _public(doc) if doc else None


def create_encounter(nombre: str) -> dict:
    encounter = Encounter(nombre=nombre)
    result = client.encounters().insert_one(
        {**encounter.model_dump(mode="json"), "updated_at": datetime.now(timezone.utc)}
    )
    return get_encounter(str(result.inserted_id))  # type: ignore[return-value]


def update_encounter(encounter_id: str, data: dict) -> dict | None:
    """Valida y reemplaza el encuentro (nombre, combatientes, ronda y turno
    actuales) por completo. Lanza pydantic.ValidationError si data no cumple
    el schema; en ese caso no persiste. Devuelve None si el id no existe."""
    try:
        oid = ObjectId(encounter_id)
    except (InvalidId, TypeError):
        return None
    encounter = Encounter.model_validate(data)
    result = client.encounters().update_one(
        {"_id": oid},
        {"$set": {**encounter.model_dump(mode="json"), "updated_at": datetime.now(timezone.utc)}},
    )
    if result.matched_count == 0:
        return None
    return get_encounter(encounter_id)


def delete_encounter(encounter_id: str) -> bool:
    try:
        oid = ObjectId(encounter_id)
    except (InvalidId, TypeError):
        return False
    result = client.encounters().delete_one({"_id": oid})
    return result.deleted_count > 0
