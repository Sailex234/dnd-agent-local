// Tipos de la hoja, espejo del schema estricto de api/bot/sheets.py.

export type Caracteristica =
  | "fuerza"
  | "destreza"
  | "constitucion"
  | "inteligencia"
  | "sabiduria"
  | "carisma";

export type Habilidad =
  | "acrobacias"
  | "trato_con_animales"
  | "arcanos"
  | "atletismo"
  | "engano"
  | "historia"
  | "perspicacia"
  | "intimidacion"
  | "investigacion"
  | "medicina"
  | "naturaleza"
  | "percepcion"
  | "interpretacion"
  | "persuasion"
  | "religion"
  | "juego_de_manos"
  | "sigilo"
  | "supervivencia";

export interface Identidad {
  especie: string;
  clase: string;
  subclase: string | null;
  nivel: number;
  trasfondo: string;
  alineamiento: string | null;
  px: number;
  tamano: string;
}

export type Caracteristicas = Record<Caracteristica, number>;

export interface Competencia {
  bono: number;
  salvaciones: Caracteristica[];
  habilidades: Habilidad[];
  armaduras: string[];
  armas: string[];
  herramientas: string[];
  idiomas: string[];
}

export interface SalvacionesMuerte {
  exitos: number;
  fallos: number;
}

export interface Combate {
  pg_max: number;
  pg_actuales: number;
  pg_temporales: number;
  dados_golpe: string;
  dados_golpe_gastados: number;
  ca: number;
  escudo: boolean;
  iniciativa: number;
  velocidad: number;
  salvaciones_muerte: SalvacionesMuerte;
  inspiracion_heroica: boolean;
}

export interface Ataque {
  nombre: string;
  bono_ataque: string;
  dano: string;
  tipo: string;
  notas: string | null;
}

export interface Rasgo {
  nombre: string;
  descripcion: string;
  origen: "clase" | "especie" | "trasfondo" | "dote";
  nivel: number | null;
}

export interface Dote {
  nombre: string;
  descripcion: string;
}

export interface Objeto {
  nombre: string;
  cantidad: number;
  peso: number;
  equipado: boolean;
  notas: string | null;
}

export interface Monedas {
  cobre: number;
  plata: number;
  electro: number;
  oro: number;
  platino: number;
}

export interface Equipo {
  objetos: Objeto[];
  monedas: Monedas;
  sintonizacion: string[];
}

export interface EspacioConjuro {
  total: number;
  gastados: number;
}

export interface ConjuroEntry {
  nivel: number;
  nombre: string;
  tiempo_lanzamiento: string | null;
  alcance: string | null;
  concentracion: boolean;
  ritual: boolean;
  material: boolean;
  notas: string | null;
  preparado: boolean;
}

export interface Conjuros {
  caracteristica_lanzamiento: Caracteristica;
  cd_salvacion: number;
  bono_ataque: number;
  espacios: Record<string, EspacioConjuro>;
  lista: ConjuroEntry[];
}

export interface CharacterSheet {
  nombre: string;
  identidad: Identidad;
  caracteristicas: Caracteristicas;
  competencia: Competencia;
  combate: Combate;
  ataques: Ataque[];
  rasgos: Rasgo[];
  dotes: Dote[];
  equipo: Equipo;
  conjuros: Conjuros | null;
  aspecto: string | null;
  historia: string | null;
  notas: string | null;
}

export interface SheetListItem {
  nombre: string;
  slug: string;
  jugadorId: string | null;
}

export interface SheetDetail {
  nombre: string;
  slug: string;
  sheet: CharacterSheet;
  updated_at: string | null;
}

export interface Player {
  id: string;
  player_id: string;
  nombre: string;
}

// Hoja minima valida contra el schema, para precargar el formulario de creacion.
export function emptySheet(): CharacterSheet {
  return {
    nombre: "",
    identidad: {
      especie: "",
      clase: "",
      subclase: null,
      nivel: 1,
      trasfondo: "",
      alineamiento: null,
      px: 0,
      tamano: "Mediano",
    },
    caracteristicas: {
      fuerza: 10,
      destreza: 10,
      constitucion: 10,
      inteligencia: 10,
      sabiduria: 10,
      carisma: 10,
    },
    competencia: {
      bono: 2,
      salvaciones: [],
      habilidades: [],
      armaduras: [],
      armas: [],
      herramientas: [],
      idiomas: [],
    },
    combate: {
      pg_max: 0,
      pg_actuales: 0,
      pg_temporales: 0,
      dados_golpe: "",
      dados_golpe_gastados: 0,
      ca: 10,
      escudo: false,
      iniciativa: 0,
      velocidad: 9,
      salvaciones_muerte: { exitos: 0, fallos: 0 },
      inspiracion_heroica: false,
    },
    ataques: [],
    rasgos: [],
    dotes: [],
    equipo: {
      objetos: [],
      monedas: { cobre: 0, plata: 0, electro: 0, oro: 0, platino: 0 },
      sintonizacion: [],
    },
    conjuros: null,
    aspecto: null,
    historia: null,
    notas: null,
  };
}

export function emptyConjuros(): Conjuros {
  return {
    caracteristica_lanzamiento: "inteligencia",
    cd_salvacion: 8,
    bono_ataque: 0,
    espacios: {},
    lista: [],
  };
}
