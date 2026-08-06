// Tipos del rastreador de combate, espejo del schema de apps/shared/shared/encounters.py.

export type TipoCombatiente = "pj" | "monstruo";

export type Combatiente = {
  nombre: string;
  tipo: TipoCombatiente;
  iniciativa: number;
  ca: number;
  pg_max: number;
  pg_actuales: number;
  condiciones: string[];
  notas?: string | null;
};

export type Encounter = {
  nombre: string;
  combatientes: Combatiente[];
  ronda_actual: number;
  turno_actual: number;
};

export type EncounterDetail = Encounter & { id: string; updated_at: string };
export type EncounterListItem = { id: string; nombre: string; updated_at: string };

export function combatienteVacio(tipo: TipoCombatiente = "pj"): Combatiente {
  return { nombre: "", tipo, iniciativa: 0, ca: 10, pg_max: 0, pg_actuales: 0, condiciones: [] };
}
