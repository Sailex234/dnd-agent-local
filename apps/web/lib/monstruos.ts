import data from "@/data/monstruos.json";

export type Caracteristica = { car: string; punt: number; mod: string; salv: string };
export type SeccionMonstruo = { titulo: string; texto: string };
export type Monstruo = {
  slug: string;
  nombre: string;
  grupo: string;
  tagline: string;
  habitat: string;
  tesoro: string;
  tamano: string;
  tipo: string;
  alineamiento: string;
  ca: string;
  iniciativa: string;
  pg: string;
  velocidad: string;
  caracteristicas: Caracteristica[];
  habilidades: string;
  sentidos: string;
  idiomas: string;
  equipo: string;
  vd: string;
  secciones: SeccionMonstruo[];
};

const MONSTRUOS = data as Monstruo[];

export function listarMonstruos(): Monstruo[] {
  return MONSTRUOS;
}

export function buscarMonstruos(q: string): Monstruo[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return MONSTRUOS;
  return MONSTRUOS.filter(
    (m) =>
      m.nombre.toLowerCase().includes(needle) ||
      m.tipo.toLowerCase().includes(needle) ||
      m.habitat.toLowerCase().includes(needle)
  );
}

export function obtenerMonstruo(slug: string): Monstruo | null {
  return MONSTRUOS.find((m) => m.slug === slug) ?? null;
}

// Modificador numerico de Destreza a partir del stat block, para "tirar iniciativa".
export function modDestreza(m: Monstruo): number {
  const fila = m.caracteristicas.find((c) => c.car === "Des");
  return fila ? parseInt(fila.mod, 10) : 0;
}

// PG maximos como numero, a partir de "66 (12d8 + 12)".
export function pgMaximos(m: Monstruo): number {
  const n = parseInt(m.pg, 10);
  return Number.isNaN(n) ? 0 : n;
}

// CA como numero, a partir de "16" o similar.
export function caNumerica(m: Monstruo): number {
  const n = parseInt(m.ca, 10);
  return Number.isNaN(n) ? 10 : n;
}

// VD (valor de desafio) como numero para el calculo de PX de la calculadora de
// encuentros, a partir de "1/4 (50 PX; BC +2)" -> 50.
export function pxDeVd(m: Monstruo): number {
  const match = m.vd.match(/\((\d[\d.]*)\s*PX/);
  if (!match) return 0;
  return parseInt(match[1].replace(/\./g, ""), 10);
}
