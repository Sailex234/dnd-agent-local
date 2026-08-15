import type { CharacterSheet, Player, SheetDetail, SheetListItem } from "./sheet";
import type { Encounter, EncounterDetail, EncounterListItem } from "./encounter";
import { AUTH_COOKIE_NAME } from "./auth";

const BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000").replace(/\/$/, "");

// La API exige HTTP Basic con la misma credencial compartida que gatea la web (ver
// middleware.ts). Este helper la lee de la cookie dnd_auth tanto en Server Components
// (via next/headers, sin acceso a document) como en Client Components (document.cookie).
async function authHeader(): Promise<Record<string, string>> {
  let value: string | undefined;
  if (typeof window === "undefined") {
    const { cookies } = await import("next/headers");
    value = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  } else {
    const raw = document.cookie
      .split("; ")
      .find((c) => c.startsWith(`${AUTH_COOKIE_NAME}=`))
      ?.split("=")[1];
    value = raw ? decodeURIComponent(raw) : undefined;
  }
  return value ? { Authorization: `Basic ${value}` } : {};
}

// Extrae un mensaje legible del cuerpo de error de la API: detail puede ser un string
// (404/409) o la lista de errores de validacion de pydantic (422).
async function errorMessage(res: Response): Promise<string> {
  try {
    const body = await res.json();
    const detail = body?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      return detail
        .map((e) => `${(e.loc ?? []).slice(1).join(".")}: ${e.msg}`)
        .join("; ");
    }
  } catch {
    // sin cuerpo JSON
  }
  return `Error ${res.status}`;
}

export async function listSheets(): Promise<SheetListItem[]> {
  const res = await fetch(`${BASE}/character-sheets`, { cache: "no-store", headers: await authHeader() });
  if (!res.ok) {
    throw new Error(`No se pudo obtener el listado de hojas (status ${res.status}).`);
  }
  const items: { nombre: string; slug: string; jugador_id: string | null }[] = await res.json();
  return items.map((i) => ({ nombre: i.nombre, slug: i.slug, jugadorId: i.jugador_id }));
}

// Devuelve la hoja, o null si la API responde 404 (personaje inexistente).
export async function getSheet(slug: string): Promise<SheetDetail | null> {
  const res = await fetch(`${BASE}/character-sheets/${encodeURIComponent(slug)}`, {
    cache: "no-store",
    headers: await authHeader(),
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`No se pudo obtener la hoja (status ${res.status}).`);
  }
  return res.json();
}

export async function listPlayers(): Promise<Player[]> {
  const res = await fetch(`${BASE}/players`, { cache: "no-store", headers: await authHeader() });
  if (!res.ok) {
    throw new Error(`No se pudo obtener el listado de jugadores (status ${res.status}).`);
  }
  return res.json();
}

export async function createPlayer(player_id: string, nombre: string): Promise<Player> {
  const res = await fetch(`${BASE}/players`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeader()) },
    body: JSON.stringify({ player_id, nombre }),
  });
  if (!res.ok) throw new Error(await errorMessage(res));
  return res.json();
}

export async function deletePlayer(player_id: string): Promise<void> {
  const res = await fetch(`${BASE}/players/${encodeURIComponent(player_id)}`, {
    method: "DELETE",
    headers: await authHeader(),
  });
  if (!res.ok && res.status !== 404) throw new Error(await errorMessage(res));
}

export async function createSheet(
  user_id: string,
  sheet: CharacterSheet,
): Promise<SheetDetail> {
  const res = await fetch(`${BASE}/character-sheets`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeader()) },
    body: JSON.stringify({ user_id, sheet }),
  });
  if (!res.ok) throw new Error(await errorMessage(res));
  return res.json();
}

export async function updateSheet(slug: string, sheet: CharacterSheet): Promise<SheetDetail> {
  const res = await fetch(`${BASE}/character-sheets/${encodeURIComponent(slug)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...(await authHeader()) },
    body: JSON.stringify({ sheet }),
  });
  if (!res.ok) throw new Error(await errorMessage(res));
  return res.json();
}

export async function listEncounters(): Promise<EncounterListItem[]> {
  const res = await fetch(`${BASE}/encounters`, { cache: "no-store", headers: await authHeader() });
  if (!res.ok) throw new Error(`No se pudo obtener el listado de encuentros (status ${res.status}).`);
  return res.json();
}

export async function getEncounter(id: string): Promise<EncounterDetail | null> {
  const res = await fetch(`${BASE}/encounters/${encodeURIComponent(id)}`, {
    cache: "no-store",
    headers: await authHeader(),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`No se pudo obtener el encuentro (status ${res.status}).`);
  return res.json();
}

export async function createEncounter(nombre: string): Promise<EncounterDetail> {
  const res = await fetch(`${BASE}/encounters`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeader()) },
    body: JSON.stringify({ nombre }),
  });
  if (!res.ok) throw new Error(await errorMessage(res));
  return res.json();
}

export async function updateEncounter(id: string, encounter: Encounter): Promise<EncounterDetail> {
  const res = await fetch(`${BASE}/encounters/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...(await authHeader()) },
    body: JSON.stringify({ encounter }),
  });
  if (!res.ok) throw new Error(await errorMessage(res));
  return res.json();
}

export async function deleteEncounter(id: string): Promise<void> {
  const res = await fetch(`${BASE}/encounters/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: await authHeader(),
  });
  if (!res.ok && res.status !== 404) throw new Error(await errorMessage(res));
}
