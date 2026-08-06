import data from "@/data/glosario.json";

export type EntradaGlosario = { termino: string; tag: string | null; contenido: string };

const GLOSARIO = data as EntradaGlosario[];

export function buscarGlosario(q: string): EntradaGlosario[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return GLOSARIO;
  return GLOSARIO.filter(
    (e) => e.termino.toLowerCase().includes(needle) || (e.tag ?? "").toLowerCase().includes(needle)
  );
}
