#!/usr/bin/env python3
"""Parsea corpus/ (monstruos, glosario, tesoros/objetos magicos, nombres de PNJ)
a JSON estatico para las paginas de referencia de apps/web. No requiere ningun
paquete de terceros ni llamados a un LLM: es contenido de reglas que no
cambia por usuario ni por sesion, se regenera solo si cambia el corpus.

Uso: python3 scripts/build_reference_data.py
"""
import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CORPUS = ROOT / "corpus"
OUT = ROOT / "apps" / "web" / "data"


def slugify(nombre: str) -> str:
    base = unicodedata.normalize("NFKD", nombre).encode("ascii", "ignore").decode("ascii").lower()
    base = re.sub(r"[^a-z0-9]+", "-", base).strip("-")
    return base or "item"


def unique_slug(nombre: str, seen: set[str]) -> str:
    base = slugify(nombre)
    slug = base
    i = 2
    while slug in seen:
        slug = f"{base}-{i}"
        i += 1
    seen.add(slug)
    return slug


# --- Monstruos ---------------------------------------------------------

KNOWN_SIZES = {
    "Diminuto", "Diminuta", "Diminutos", "Diminutas",
    "Pequeño", "Pequeña", "Pequeños", "Pequeñas",
    "Mediano", "Mediana", "Medianos", "Medianas",
    "Grande", "Grandes",
    "Enorme", "Enormes",
    "Gargantuesco", "Gargantuesca", "Gargantuescos", "Gargantuescas",
}


def split_tipo_tamano(left: str) -> tuple[str, str]:
    """'Dragón Enorme (cromático)' -> ('Dragón (cromático)', 'Enorme');
    'Humanoide Mediano o Pequeño' -> ('Humanoide', 'Mediano o Pequeño')."""
    paren = ""
    pm = re.search(r"\s*(\([^)]*\))\s*$", left)
    if pm:
        paren = " " + pm.group(1)
        left = left[: pm.start()].strip()
    tokens = left.split(" ")
    if len(tokens) >= 3 and tokens[-2].lower() == "o" and tokens[-1] in KNOWN_SIZES and tokens[-3] in KNOWN_SIZES:
        tamano = " ".join(tokens[-3:])
        tipo = " ".join(tokens[:-3])
    elif tokens[-1] in KNOWN_SIZES:
        tamano = tokens[-1]
        tipo = " ".join(tokens[:-1])
    else:
        tamano = ""
        tipo = left
    return (tipo + paren).strip(), tamano


HEADING_RE = re.compile(r"^(#{1,4})\s+(.+)$")
TIPO_LINE_RE = re.compile(r"^\*(.+?),\s*(.+?)\*$")
CA_LINE_RE = re.compile(
    r"^-\s+\*\*CA:\*\*\s*(.+?)\s+—\s+\*\*Iniciativa:\*\*\s*(.+)$"
)
PG_LINE_RE = re.compile(r"^-\s+\*\*PG:\*\*\s*(.+)$")
VEL_LINE_RE = re.compile(r"^-\s+\*\*Velocidad:\*\*\s*(.+)$")
STAT_ROW_RE = re.compile(r"^\|\s*(Fue|Des|Con|Int|Sab|Car)\s*\|\s*(-?\d+)\s*\|\s*([+-]\d+)\s*\|\s*([+-]\d+)\s*\|$")
FIELD_LINE_RE = re.compile(r"^-\s+\*\*(Habilidades|Sentidos|Idiomas|Equipo|VD):\*\*\s*(.*)$", re.IGNORECASE)
SECTION_HEADING_RE = re.compile(
    r"^(?:#{2,6}\s+(Atributos|Acciones(?: adicionales| legendarias)?|Reacciones|Rasgos)\s*$"
    r"|\*\*(Atributos|Acciones(?: adicionales| legendarias)?|Reacciones|Rasgos)\*\*\s*$)",
    re.IGNORECASE,
)


def _group_context(lines: list[str], start: int, n: int) -> dict:
    """Escanea un puñado de lineas despues de un heading de grupo (## Nombre)
    para sacar tagline (primera linea en cursiva sola) y Habitat/Tesoro, sin
    seguir de largo hasta el proximo stat block (por eso el limite de 15
    lineas / corte en el primer heading)."""
    tagline = habitat = tesoro = ""
    k = start
    limit = min(start + 15, n)
    while k < limit and not lines[k].startswith("#"):
        stripped = lines[k].strip()
        if not tagline and stripped.startswith("*") and stripped.endswith("*") and not stripped.startswith("**"):
            tagline = stripped.strip("*")
        hab_m = re.match(r"^\*\*Hábitat:\*\*\s*(.+?)\.\s*\*\*Tesoro:\*\*\s*(.+)$", stripped)
        if hab_m:
            habitat, tesoro = hab_m.group(1), hab_m.group(2).rstrip(".")
            break
        k += 1
    return {"tagline": tagline, "habitat": habitat, "tesoro": tesoro}


def parse_monster_file(path: Path) -> list[dict]:
    lines = path.read_text(encoding="utf-8").splitlines()
    n = len(lines)

    # ubicar cada bloque de estadisticas por su ancla mas confiable: la linea
    # "- **CA:** ... — **Iniciativa:** ...". A partir de ahi se camina hacia
    # atras (nombre + tipo/alineamiento) y hacia adelante (resto del bloque).
    anchors = [i for i, l in enumerate(lines) if CA_LINE_RE.match(l)]

    # titulo de grupo (## mas cercano hacia atras) y su tagline/habitat, para
    # dar contexto cuando el nombre del stat block es distinto (ej.
    # "## Kobolds" agrupa a "Guerrero kobold", "Kobold alado", etc.)
    group_name = ""
    group_ctx = {"tagline": "", "habitat": "", "tesoro": ""}

    monsters = []
    seen_slugs: set[str] = set()

    for idx, anchor in enumerate(anchors):
        # nombre: heading mas cercano hacia atras (cualquier nivel #, ##, ### o ####)
        name = None
        heading_level = 0
        j = anchor
        while j >= 0:
            m = HEADING_RE.match(lines[j])
            if m:
                heading_level = len(m.group(1))
                name = m.group(2).strip()
                break
            j -= 1
        if name is None:
            continue

        if heading_level == 2:
            group_name = name
            group_ctx = _group_context(lines, j + 1, n)
        else:
            # buscar tambien el ## ancestro mas cercano para no perder el contexto
            k = j - 1
            while k >= 0:
                m2 = HEADING_RE.match(lines[k])
                if m2 and len(m2.group(1)) == 2:
                    ancestor = m2.group(2).strip()
                    if ancestor != group_name:
                        group_name = ancestor
                        group_ctx = _group_context(lines, k + 1, n)
                    break
                k -= 1

        # tipo/tamano/alineamiento: la linea "*Tipo Tamaño, alineamiento*" mas
        # cercana al bloque de estadisticas, buscando hacia atras desde el
        # ancla (puede estar pegada al heading o mas lejos, separada por
        # parrafos de lore, segun el monstruo).
        tamano = tipo = alineamiento = ""
        for probe in range(anchor - 1, j, -1):
            tm = TIPO_LINE_RE.match(lines[probe].strip())
            if tm:
                left, alineamiento = tm.group(1), tm.group(2)
                tipo, tamano = split_tipo_tamano(left)
                break

        ca_m = CA_LINE_RE.match(lines[anchor])
        ca, iniciativa = ca_m.group(1).strip(), ca_m.group(2).strip()

        pg = velocidad = ""
        caracteristicas = []
        campos = {}
        secciones: list[dict] = []
        current_section = None

        end = anchors[idx + 1] if idx + 1 < len(anchors) else n
        # no cruzar al siguiente heading de nivel <=2 (evita mezclar con el proximo monstruo/grupo)
        limit = end
        for k in range(anchor + 1, end):
            m = HEADING_RE.match(lines[k])
            if m and len(m.group(1)) <= 2:
                limit = k
                break

        k = anchor + 1
        while k < limit:
            line = lines[k]
            stripped = line.strip()
            if pg == "" and PG_LINE_RE.match(stripped):
                pg = PG_LINE_RE.match(stripped).group(1).strip()
            elif velocidad == "" and VEL_LINE_RE.match(stripped):
                velocidad = VEL_LINE_RE.match(stripped).group(1).strip()
            elif STAT_ROW_RE.match(stripped):
                sm = STAT_ROW_RE.match(stripped)
                caracteristicas.append(
                    {"car": sm.group(1), "punt": int(sm.group(2)), "mod": sm.group(3), "salv": sm.group(4)}
                )
            elif FIELD_LINE_RE.match(stripped):
                fm = FIELD_LINE_RE.match(stripped)
                campos[fm.group(1).capitalize()] = fm.group(2).strip()
            else:
                sec_m = SECTION_HEADING_RE.match(stripped)
                if sec_m:
                    titulo = (sec_m.group(1) or sec_m.group(2)).strip()
                    current_section = {"titulo": titulo, "texto": []}
                    secciones.append(current_section)
                elif current_section is not None and stripped:
                    current_section["texto"].append(line)
            k += 1

        if not ca or not pg:
            continue

        for sec in secciones:
            sec["texto"] = "\n".join(sec["texto"]).strip()

        slug = unique_slug(name, seen_slugs)
        monsters.append(
            {
                "slug": slug,
                "nombre": name,
                "grupo": group_name if group_name != name else "",
                "tagline": group_ctx["tagline"],
                "habitat": group_ctx["habitat"],
                "tesoro": group_ctx["tesoro"],
                "tamano": tamano,
                "tipo": tipo,
                "alineamiento": alineamiento,
                "ca": ca,
                "iniciativa": iniciativa,
                "pg": pg,
                "velocidad": velocidad,
                "caracteristicas": caracteristicas,
                "habilidades": campos.get("Habilidades", ""),
                "sentidos": campos.get("Sentidos", ""),
                "idiomas": campos.get("Idiomas", ""),
                "equipo": campos.get("Equipo", ""),
                "vd": campos.get("Vd", ""),
                "secciones": secciones,
            }
        )

    return monsters


def build_monstruos() -> list[dict]:
    result = []
    for path in sorted((CORPUS / "manual-monstruos" / "bestiario").glob("*.md")):
        result.extend(parse_monster_file(path))
    return result


# --- Glosario ------------------------------------------------------------

GLOSARIO_HEADING_RE = re.compile(r"^###\s+(.+?)(?:\s*\[(.+?)\])?\s*$")


def build_glosario() -> list[dict]:
    path = CORPUS / "manual-jugador" / "08-apendices.md"
    lines = path.read_text(encoding="utf-8").splitlines()
    entries = []
    current = None
    for line in lines:
        m = GLOSARIO_HEADING_RE.match(line)
        if m:
            if current is not None:
                current["contenido"] = "\n".join(current["contenido"]).strip()
                if current["contenido"]:
                    entries.append(current)
            current = {"termino": m.group(1).strip(), "tag": m.group(2), "contenido": []}
        elif current is not None:
            if line.startswith("## "):
                current["contenido"] = "\n".join(current["contenido"]).strip()
                if current["contenido"]:
                    entries.append(current)
                current = None
            else:
                current["contenido"].append(line)
    if current is not None:
        current["contenido"] = "\n".join(current["contenido"]).strip()
        if current["contenido"]:
            entries.append(current)
    return entries


# --- Botin / objetos magicos aleatorios ----------------------------------

RANGO_ROW_RE = re.compile(r"^\|\s*([\d]{1,3}(?:-[\d]{1,3})?)\s*\|\s*(.+?)\s*\|$")
TABLE_TITLE_RE = re.compile(r"^(?:###\s+(.+)|\*\*([^*]+)\*\*)$")


def _parse_dice_tables(text: str) -> list[dict]:
    """Extrae bloques de titulo ('### Titulo' o '**Titulo**' solo) + tabla
    markdown de 2 columnas (rango|objeto), quedandose solo con las que
    realmente son tiradas de dado (traen encabezado 1dNN o un rango numerico
    en la primera columna)."""
    lines = text.splitlines()
    tablas = []
    current_title = None
    current_rows: list[dict] = []
    dado = None

    def flush():
        if current_title and current_rows:
            tablas.append({"titulo": current_title, "dado": dado or "", "filas": current_rows})

    for line in lines:
        tm = TABLE_TITLE_RE.match(line.strip())
        if tm:
            flush()
            current_title = (tm.group(1) or tm.group(2)).strip()
            current_rows = []
            dado = None
            continue
        if current_title is None:
            continue
        stripped = line.strip()
        if stripped.startswith("|") and set(stripped.replace("|", "").replace("-", "").strip()) == set():
            continue  # fila separadora ---|---
        header_m = re.match(r"^\|\s*(1d\d+)\s*\|\s*(.+?)\s*\|$", stripped)
        if header_m:
            dado = header_m.group(1)
            continue
        rm = RANGO_ROW_RE.match(stripped)
        if rm and rm.group(1).lower() not in ("---",):
            current_rows.append({"rango": rm.group(1), "objeto": rm.group(2)})
    flush()
    return tablas


def build_botin() -> dict:
    aleatorios = CORPUS / "guia-dm" / "objetos-magicos" / "aleatorios.md"
    tesoros_lines = (CORPUS / "guia-dm" / "07-tesoros.md").read_text(encoding="utf-8").splitlines()
    # Solo hasta "## Objetos mágicos": de ahi en adelante son reglas generales
    # (rareza, sintonizacion, artefactos), no tablas de tesoro para tirar.
    corte = next((i for i, l in enumerate(tesoros_lines) if l.strip() == "## Objetos mágicos"), len(tesoros_lines))
    return {
        "objetos_magicos": _parse_dice_tables(aleatorios.read_text(encoding="utf-8")),
        "tesoros": _parse_dice_tables("\n".join(tesoros_lines[:corte])),
    }


# --- Nombres de PNJ -------------------------------------------------------

PNJ_TABLE_TITLE_RE = re.compile(r"^\*\*\d+:\s*(.+?)\*\*\s*$")


def build_nombres_pnj() -> list[dict]:
    path = CORPUS / "guia-dm" / "03-herramientas-dm.md"
    lines = path.read_text(encoding="utf-8").splitlines()
    grupos = []
    current = None
    for line in lines:
        stripped = line.strip()
        tm = PNJ_TABLE_TITLE_RE.match(stripped)
        if tm:
            if current and current["nombres"]:
                grupos.append(current)
            current = {"cultura": tm.group(1).strip(), "nombres": [], "apellidos": []}
            continue
        if current is None:
            continue
        row_m = re.match(r"^\|\s*(\d+)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|$", stripped)
        if row_m and row_m.group(1) != "1d12":
            current["nombres"].append(row_m.group(2))
            current["apellidos"].append(row_m.group(3))
        elif stripped.startswith("#") or (stripped == "" and current and len(current["nombres"]) >= 12):
            grupos.append(current)
            current = None
    if current and current["nombres"]:
        grupos.append(current)
    return grupos


def main():
    OUT.mkdir(parents=True, exist_ok=True)

    monstruos = build_monstruos()
    (OUT / "monstruos.json").write_text(json.dumps(monstruos, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"monstruos.json: {len(monstruos)} perfiles")

    glosario = build_glosario()
    (OUT / "glosario.json").write_text(json.dumps(glosario, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"glosario.json: {len(glosario)} terminos")

    botin = build_botin()
    (OUT / "botin.json").write_text(json.dumps(botin, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"botin.json: {len(botin['objetos_magicos'])} tablas de objetos magicos, {len(botin['tesoros'])} tablas de tesoros")

    pnj = build_nombres_pnj()
    (OUT / "pnj-nombres.json").write_text(json.dumps(pnj, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"pnj-nombres.json: {len(pnj)} tablas de nombres")


if __name__ == "__main__":
    main()
