"""Hoja de personaje: schema estricto (Pydantic) y logica pura sobre Mongo.

La terminologia sigue el Manual del Jugador 2024 en espanol
(especie, trasfondo, dote, rasgo, competencia, tirada de salvacion). Se guardan los
valores base; los derivados que son funcion pura de ellos (modificador de
caracteristica, total de salvaciones/habilidades) no se persisten.
"""

import re
import unicodedata
from datetime import datetime, timezone
from enum import Enum

from bson import ObjectId
from bson.errors import InvalidId
from pydantic import BaseModel, ConfigDict, Field

from .db import client


def _normalize_enum_token(s: str) -> str:
    """Normaliza un token de enum (caracteristica, habilidad, origen) para tolerar
    variantes de formato que manda el agente (mayuscula, acentos, espacios en vez de
    guion bajo): sin acentos, minuscula, espacios/guiones colapsados a `_`. Solo
    normaliza formato, no mapea sinonimos ni vocabulario distinto."""
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode("ascii").lower().strip()
    return re.sub(r"[\s-]+", "_", s)


# --- Enums acotados del dominio ---
#
# `_missing_` en cada enum tolera que el agente mande una variante de formato
# razonable ("Fuerza", "Constitución", "Trato con animales") en vez del token
# canonico: normaliza y reintenta el lookup antes de fallar. Un valor que, ya
# normalizado, sigue sin matchear ningun miembro devuelve None (comportamiento
# estandar de `_missing_`), y pydantic lo traduce al error de enum de siempre.


class Caracteristica(str, Enum):
    fuerza = "fuerza"
    destreza = "destreza"
    constitucion = "constitucion"
    inteligencia = "inteligencia"
    sabiduria = "sabiduria"
    carisma = "carisma"

    @classmethod
    def _missing_(cls, value):
        if isinstance(value, str):
            normalized = _normalize_enum_token(value)
            for member in cls:
                if member.value == normalized:
                    return member
        return None


class Habilidad(str, Enum):
    acrobacias = "acrobacias"
    trato_con_animales = "trato_con_animales"
    arcanos = "arcanos"
    atletismo = "atletismo"
    engano = "engano"
    historia = "historia"
    perspicacia = "perspicacia"
    intimidacion = "intimidacion"
    investigacion = "investigacion"
    medicina = "medicina"
    naturaleza = "naturaleza"
    percepcion = "percepcion"
    interpretacion = "interpretacion"
    persuasion = "persuasion"
    religion = "religion"
    juego_de_manos = "juego_de_manos"
    sigilo = "sigilo"
    supervivencia = "supervivencia"

    @classmethod
    def _missing_(cls, value):
        if isinstance(value, str):
            normalized = _normalize_enum_token(value)
            for member in cls:
                if member.value == normalized:
                    return member
        return None


class OrigenRasgo(str, Enum):
    clase = "clase"
    especie = "especie"
    trasfondo = "trasfondo"
    dote = "dote"

    @classmethod
    def _missing_(cls, value):
        if isinstance(value, str):
            normalized = _normalize_enum_token(value)
            for member in cls:
                if member.value == normalized:
                    return member
        return None


# --- Modelos de la hoja (estructura cerrada: extra="forbid") ---


class _Strict(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Identidad(_Strict):
    especie: str
    clase: str
    subclase: str | None = None
    nivel: int = Field(ge=1, le=20)
    trasfondo: str
    alineamiento: str | None = None
    px: int = Field(default=0, ge=0)
    tamano: str = "Mediano"


class Caracteristicas(_Strict):
    fuerza: int = Field(ge=1, le=30)
    destreza: int = Field(ge=1, le=30)
    constitucion: int = Field(ge=1, le=30)
    inteligencia: int = Field(ge=1, le=30)
    sabiduria: int = Field(ge=1, le=30)
    carisma: int = Field(ge=1, le=30)


class Competencia(_Strict):
    bono: int = Field(ge=0)
    salvaciones: list[Caracteristica] = Field(default_factory=list)
    # Habilidades en las que el personaje es competente. La pericia (competencia x2) no
    # se modela aca: se carga como un rasgo, igual que el resto de los rasgos de clase.
    habilidades: list[Habilidad] = Field(default_factory=list)
    armaduras: list[str] = Field(default_factory=list)
    armas: list[str] = Field(default_factory=list)
    herramientas: list[str] = Field(default_factory=list)
    idiomas: list[str] = Field(default_factory=list)


class SalvacionesMuerte(_Strict):
    exitos: int = Field(default=0, ge=0, le=3)
    fallos: int = Field(default=0, ge=0, le=3)


class Combate(_Strict):
    pg_max: int = Field(ge=0)
    pg_actuales: int
    pg_temporales: int = 0
    dados_golpe: str  # ej. "4d12"
    dados_golpe_gastados: int = Field(default=0, ge=0)
    ca: int
    escudo: bool = False
    iniciativa: int
    velocidad: int  # pies
    salvaciones_muerte: SalvacionesMuerte = Field(default_factory=SalvacionesMuerte)
    inspiracion_heroica: bool = False


class Ataque(_Strict):
    nombre: str
    bono_ataque: str  # "+6" o "CD 15" (columna Bonif. atq./CD de la hoja)
    dano: str  # ej. "1d12+4 cortante"
    tipo: str = ""
    notas: str | None = None


class Rasgo(_Strict):
    nombre: str
    descripcion: str
    origen: OrigenRasgo
    nivel: int | None = None


class Dote(_Strict):
    nombre: str
    descripcion: str


class Objeto(_Strict):
    nombre: str
    cantidad: int = Field(default=1, ge=0)
    peso: float = Field(default=0, ge=0)  # kg por unidad
    equipado: bool = False
    notas: str | None = None


class Monedas(_Strict):
    cobre: int = 0
    plata: int = 0
    electro: int = 0
    oro: int = 0
    platino: int = 0


class Equipo(_Strict):
    objetos: list[Objeto] = Field(default_factory=list)
    monedas: Monedas = Field(default_factory=Monedas)
    sintonizacion: list[str] = Field(default_factory=list)  # objetos magicos sintonizados


class EspacioConjuro(_Strict):
    total: int = Field(ge=0)
    gastados: int = Field(default=0, ge=0)


class ConjuroEntry(_Strict):
    nivel: int = Field(ge=0, le=9)  # 0 = truco
    nombre: str
    tiempo_lanzamiento: str | None = None
    alcance: str | None = None
    concentracion: bool = False
    ritual: bool = False
    material: bool = False
    notas: str | None = None
    preparado: bool = False


class Conjuros(_Strict):
    caracteristica_lanzamiento: Caracteristica
    cd_salvacion: int
    bono_ataque: int
    espacios: dict[int, EspacioConjuro] = Field(default_factory=dict)  # nivel -> total/gastados
    lista: list[ConjuroEntry] = Field(default_factory=list)


class CharacterSheet(_Strict):
    nombre: str
    identidad: Identidad
    caracteristicas: Caracteristicas
    competencia: Competencia
    combate: Combate
    ataques: list[Ataque] = Field(default_factory=list)
    rasgos: list[Rasgo] = Field(default_factory=list)
    dotes: list[Dote] = Field(default_factory=list)
    equipo: Equipo = Field(default_factory=Equipo)
    conjuros: Conjuros | None = None
    aspecto: str | None = None
    historia: str | None = None
    notas: str | None = None


class CambiosHoja(_Strict):
    """Patch parcial de la hoja: SOLO los campos que cambian. El agente no pasa la hoja
    entera. Las secciones anidadas se fusionan por clave sobre la hoja actual; las listas se
    reemplazan enteras (ver merge_patch). El tipo de cada seccion queda laxo (dict/list)
    porque es un patch: la validacion estricta corre sobre la hoja resultante fusionada. Top
    level cerrado (extra="forbid") para cazar nombres de seccion mal escritos al instante."""

    nombre: str | None = None
    identidad: dict | None = None
    caracteristicas: dict | None = None
    competencia: dict | None = None
    combate: dict | None = None
    ataques: list | None = None
    rasgos: list | None = None
    dotes: list | None = None
    equipo: dict | None = None
    conjuros: dict | None = None
    aspecto: str | None = None
    historia: str | None = None
    notas: str | None = None


# --- Logica sobre Mongo ---


def list_own_sheets(user_id: str) -> list[dict]:
    """Devuelve las hojas del usuario (0 a N), cada una como {id, nombre, sheet,
    updated_at}, ordenadas por nombre de personaje. `id` es el _id de Mongo de esa hoja
    (string), usado para referenciarla en pendientes y actualizaciones."""
    out = []
    for doc in client.character_sheets().find({"user_id": user_id}).sort("nombre", 1):
        doc["id"] = str(doc.pop("_id"))
        out.append(doc)
    return out


class NoOwnSheet(Exception):
    """El usuario no tiene ninguna hoja."""


class AmbiguousOwnSheet(Exception):
    """El usuario tiene mas de una hoja y no se pudo resolver a una sola (no se dio
    `nombre`, o el `nombre` dado no matchea ninguna hoja propia). Trae los nombres de
    las hojas propias para que el caller arme un mensaje de desambiguacion."""

    def __init__(self, options: list[str]):
        super().__init__(options)
        self.options = options


def resolve_own_sheet(user_id: str, nombre: str = "") -> dict:
    """Resuelve UNA hoja propia del usuario: por `nombre` si se da, o la unica que
    tiene si no se da nombre y solo tiene una. Devuelve el doc {id, nombre, sheet,
    updated_at}.

    Lanza NoOwnSheet si el usuario no tiene ninguna hoja, o AmbiguousOwnSheet si tiene
    mas de una y no se pudo resolver a una sola (sin nombre, o nombre sin match entre
    las propias)."""
    own = list_own_sheets(user_id)
    if not own:
        raise NoOwnSheet()
    if nombre.strip():
        target = _norm(nombre)
        matches = [d for d in own if _norm(d.get("nombre", "")) == target]
        if len(matches) == 1:
            return matches[0]
        raise AmbiguousOwnSheet([d["nombre"] for d in own])
    if len(own) == 1:
        return own[0]
    raise AmbiguousOwnSheet([d["nombre"] for d in own])


def _norm(s: str) -> str:
    """Normaliza para comparar nombres: sin acentos, minusculas, sin espacios extremos."""
    return (
        unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode("ascii").lower().strip()
    )


def slugify(nombre: str) -> str:
    """Slug estable a partir del nombre del personaje: minusculas, sin acentos, no
    alfanumerico colapsado a guion."""
    base = unicodedata.normalize("NFKD", nombre).encode("ascii", "ignore").decode("ascii").lower()
    base = re.sub(r"[^a-z0-9]+", "-", base).strip("-")
    return base or "personaje"


def _slugged_sheets() -> list[dict]:
    """Devuelve los docs de character_sheets (con su `id`, el _id de Mongo como string)
    con un slug unico y estable agregado. El slug sale del nombre del personaje; ante
    colision se desempata con un sufijo numerico por orden de `_id` (insercion, estable
    entre llamadas)."""
    docs = list(client.character_sheets().find({}).sort("_id", 1))
    seen: set[str] = set()
    out = []
    for doc in docs:
        doc["id"] = str(doc.pop("_id"))
        base = slugify(doc.get("nombre", ""))
        slug = base
        i = 2
        while slug in seen:
            slug = f"{base}-{i}"
            i += 1
        seen.add(slug)
        out.append({**doc, "slug": slug})
    return out


def list_sheets() -> list[dict]:
    """Listado publico de personajes: nombre del personaje, slug y el id del jugador
    dueño (para que la web agrupe hojas por jugador), sin player_id."""
    return [
        {"nombre": d.get("nombre", ""), "slug": d["slug"], "jugador_id": d.get("user_id")}
        for d in _slugged_sheets()
    ]


def list_characters() -> list[dict]:
    """Listado para el agente: nombre del personaje y nombre del jugador dueño, sin
    exponer `user_id` ni `player_id`. Un mismo jugador puede aparecer en varias filas
    si tiene mas de un personaje."""
    players = {u["id"]: u.get("nombre", "") for u in client.list_users()}
    out = []
    for doc in client.character_sheets().find({}).sort("nombre", 1):
        out.append(
            {"personaje": doc.get("nombre", ""), "jugador": players.get(doc.get("user_id"), "")}
        )
    return out


def _public(d: dict) -> dict:
    """Representacion publica de un doc con slug: sin datos de usuario."""
    return {
        "nombre": d.get("nombre", ""),
        "slug": d["slug"],
        "sheet": d.get("sheet"),
        "updated_at": d.get("updated_at"),
    }


def read_sheet_by_slug(slug: str) -> dict | None:
    """Hoja publica por slug: {nombre, slug, sheet, updated_at} sin datos de usuario, o
    None."""
    for d in _slugged_sheets():
        if d["slug"] == slug:
            return _public(d)
    return None


def delete_sheets_by_user(user_id: str) -> int:
    """Borra todas las hojas de un jugador (usado al borrar el jugador). Devuelve cuantas
    hojas borro."""
    return client.character_sheets().delete_many({"user_id": user_id}).deleted_count


class PlayerNotFound(Exception):
    """El user_id no corresponde a un usuario dado de alta."""


def create_sheet(user_id: str, sheet_in: dict) -> dict:
    """Crea una hoja desde la web para el usuario dado. Valida contra el schema y exige
    que el usuario este dado de alta; un usuario puede tener cualquier cantidad de hojas
    (sin restriccion de cardinalidad). Devuelve el doc publico (con slug) de la hoja
    recien creada.

    Lanza pydantic.ValidationError si sheet_in no cumple el schema, o PlayerNotFound si
    el usuario no existe. En esos casos no persiste."""
    sheet = CharacterSheet.model_validate(sheet_in)
    if client.get_user(user_id) is None:
        raise PlayerNotFound()
    coll = client.character_sheets()
    result = coll.insert_one(
        {
            "user_id": user_id,
            "nombre": sheet.nombre,
            "sheet": sheet.model_dump(mode="json"),
            "updated_at": datetime.now(timezone.utc),
        }
    )
    new_id = str(result.inserted_id)
    for d in _slugged_sheets():
        if d["id"] == new_id:
            return _public(d)
    raise RuntimeError("La hoja recien creada no se encontro.")


def update_sheet_by_slug(slug: str, sheet_in: dict) -> dict | None:
    """Actualiza la hoja existente identificada por slug. Valida contra el schema y
    reemplaza el sheet del documento. Devuelve el doc publico (con el slug recalculado a
    partir del nombre nuevo) o None si el slug no resuelve.

    Lanza pydantic.ValidationError si sheet_in no cumple el schema."""
    sheet_id = None
    for d in _slugged_sheets():
        if d["slug"] == slug:
            sheet_id = d["id"]
            break
    if sheet_id is None:
        return None
    sheet = CharacterSheet.model_validate(sheet_in)
    client.character_sheets().update_one(
        {"_id": ObjectId(sheet_id)},
        {
            "$set": {
                "nombre": sheet.nombre,
                "sheet": sheet.model_dump(mode="json"),
                "updated_at": datetime.now(timezone.utc),
            }
        },
    )
    for d in _slugged_sheets():
        if d["id"] == sheet_id:
            return _public(d)
    return None


def resolve_sheet_by_name(name: str) -> dict | None:
    """Resuelve un nombre destino (de personaje, o de jugador si tiene una unica hoja) a
    su documento de hoja. Match sin acentos ni mayusculas. Devuelve el doc {id, user_id,
    nombre, sheet, updated_at} o None si no resuelve (incluido el caso de un nombre de
    jugador con mas de una hoja: no hay forma no ambigua de elegir una)."""
    target = _norm(name)
    for doc in client.character_sheets().find({}):
        if _norm(doc.get("nombre", "")) == target:
            doc["id"] = str(doc.pop("_id"))
            return doc
    for user in client.list_users():
        if _norm(user.get("nombre", "")) == target:
            own = list_own_sheets(user["id"])
            return own[0] if len(own) == 1 else None
    return None


def merge_patch(base: dict, patch: dict) -> dict:
    """Fusiona `patch` sobre `base` al estilo JSON Merge Patch, SIN borrado por null: los
    objetos anidados se fusionan recursivamente; cualquier otro valor (escalar, lista o null)
    reemplaza el valor previo. O sea, las listas se reemplazan enteras (no se fusionan por
    elemento) y un null explicito setea el campo a null."""
    out = dict(base)
    for k, v in patch.items():
        if isinstance(v, dict) and isinstance(out.get(k), dict):
            out[k] = merge_patch(out[k], v)
        else:
            out[k] = v
    return out


def propose_patch(user_id: str, nombre: str, cambios: dict, resumen: str) -> str:
    """Resuelve UNA hoja propia del usuario (por `nombre` si se da, o la unica que
    tiene), aplica el patch (solo los campos que cambian) sobre su hoja actual, valida
    la hoja resultante completa y registra la propuesta pendiente para esa hoja.
    Devuelve el id de la pendiente.

    Lanza NoOwnSheet si el usuario no tiene ninguna hoja, AmbiguousOwnSheet si tiene mas
    de una y no se pudo resolver a una sola, o pydantic.ValidationError si la hoja
    resultante no cumple el schema (en ese caso no persiste nada)."""
    doc = resolve_own_sheet(user_id, nombre)
    merged = merge_patch(doc["sheet"], cambios)
    return propose_update(doc["id"], user_id, merged, resumen)


def propose_update(sheet_id: str, user_id: str, sheet_after: dict, resumen: str) -> str:
    """Valida la hoja resultante contra el schema y registra una propuesta pendiente
    para esa hoja concreta (una por hoja, la reemplaza si ya habia una para la misma
    hoja; hojas distintas del mismo usuario tienen pendientes independientes). Devuelve
    el id de la pendiente.

    Lanza pydantic.ValidationError si sheet_after no cumple el schema; en ese caso no
    persiste nada (el caller traduce el error para el agente)."""
    sheet = CharacterSheet.model_validate(sheet_after)
    coll = client.pending_sheet_changes()
    res = coll.replace_one(
        {"sheet_id": sheet_id},
        {
            "sheet_id": sheet_id,
            "user_id": user_id,
            "sheet": sheet.model_dump(mode="json"),
            "resumen": resumen,
            "created_at": datetime.now(timezone.utc),
        },
        upsert=True,
    )
    if res.upserted_id is not None:
        return str(res.upserted_id)
    doc = coll.find_one({"sheet_id": sheet_id}, {"_id": 1})
    return str(doc["_id"])


