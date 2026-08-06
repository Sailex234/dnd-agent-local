import type {
  Caracteristica,
  Caracteristicas,
  Competencia,
  Habilidad,
} from "./sheet";

export const CARACTERISTICAS: Caracteristica[] = [
  "fuerza",
  "destreza",
  "constitucion",
  "inteligencia",
  "sabiduria",
  "carisma",
];

export const LABEL_CARACTERISTICA: Record<Caracteristica, string> = {
  fuerza: "Fuerza",
  destreza: "Destreza",
  constitucion: "Constitucion",
  inteligencia: "Inteligencia",
  sabiduria: "Sabiduria",
  carisma: "Carisma",
};

export const ABREV_CARACTERISTICA: Record<Caracteristica, string> = {
  fuerza: "FUE",
  destreza: "DES",
  constitucion: "CON",
  inteligencia: "INT",
  sabiduria: "SAB",
  carisma: "CAR",
};

// Habilidad -> caracteristica asociada (Manual del Jugador 2024).
export const HABILIDAD_CARACTERISTICA: Record<Habilidad, Caracteristica> = {
  acrobacias: "destreza",
  trato_con_animales: "sabiduria",
  arcanos: "inteligencia",
  atletismo: "fuerza",
  engano: "carisma",
  historia: "inteligencia",
  perspicacia: "sabiduria",
  intimidacion: "carisma",
  investigacion: "inteligencia",
  medicina: "sabiduria",
  naturaleza: "inteligencia",
  percepcion: "sabiduria",
  interpretacion: "carisma",
  persuasion: "carisma",
  religion: "inteligencia",
  juego_de_manos: "destreza",
  sigilo: "destreza",
  supervivencia: "sabiduria",
};

export const LABEL_HABILIDAD: Record<Habilidad, string> = {
  acrobacias: "Acrobacias",
  trato_con_animales: "Trato con Animales",
  arcanos: "Arcanos",
  atletismo: "Atletismo",
  engano: "Engano",
  historia: "Historia",
  perspicacia: "Perspicacia",
  intimidacion: "Intimidacion",
  investigacion: "Investigacion",
  medicina: "Medicina",
  naturaleza: "Naturaleza",
  percepcion: "Percepcion",
  interpretacion: "Interpretacion",
  persuasion: "Persuasion",
  religion: "Religion",
  juego_de_manos: "Juego de Manos",
  sigilo: "Sigilo",
  supervivencia: "Supervivencia",
};

export const HABILIDADES: Habilidad[] = Object.keys(HABILIDAD_CARACTERISTICA) as Habilidad[];

// Conjuntos cerrados de competencia (Manual del Jugador 2024). El value es el token que
// se guarda en la hoja; el label es lo que se muestra. Para armaduras/armas se mantienen
// los tokens en minuscula que ya usaba la data existente.
export const ARMADURAS: { value: string; label: string }[] = [
  { value: "ligera", label: "Ligera" },
  { value: "media", label: "Media" },
  { value: "pesada", label: "Pesada" },
  { value: "escudos", label: "Escudos" },
];

export const ARMAS: { value: string; label: string }[] = [
  { value: "simples", label: "Simples" },
  { value: "marciales", label: "Marciales" },
];

// Conjuntos cerrados de identidad (Manual del Jugador 2024). value === label.
export const ESPECIES: string[] = [
  "Aasimar",
  "Dracónido",
  "Elfo",
  "Enano",
  "Gnomo",
  "Goliat",
  "Humano",
  "Mediano",
  "Orco",
  "Tiefling",
];

export const CLASES: string[] = [
  "Bárbaro",
  "Bardo",
  "Brujo",
  "Clérigo",
  "Druida",
  "Explorador",
  "Guerrero",
  "Hechicero",
  "Mago",
  "Monje",
  "Paladín",
  "Pícaro",
];

// Subclases por clase (se eligen a nivel 3). El select de subclase depende de la clase.
export const SUBCLASES: Record<string, string[]> = {
  "Bárbaro": [
    "Senda del Árbol del Mundo",
    "Senda del Berserker",
    "Senda del Corazón Salvaje",
    "Senda del Fanático",
  ],
  Bardo: [
    "Colegio de la Danza",
    "Colegio del Conocimiento",
    "Colegio del Glamour",
    "Colegio del Valor",
  ],
  Brujo: ["Patrón Celestial", "Patrón Feérico", "Patrón Infernal", "Patrón Primigenio"],
  "Clérigo": [
    "Dominio de la Guerra",
    "Dominio de la Luz",
    "Dominio de la Vida",
    "Dominio del Engaño",
  ],
  Druida: [
    "Círculo de la Luna",
    "Círculo de la Tierra",
    "Círculo de las Estrellas",
    "Círculo del Mar",
  ],
  Explorador: ["Acechador en la Penumbra", "Cazador", "Errante Feérico", "Señor de las Bestias"],
  Guerrero: ["Caballero Arcano", "Campeón", "Guerrero Psiónico", "Maestro del Combate"],
  Hechicero: [
    "Hechicería Aberrante",
    "Hechicería de Magia Salvaje",
    "Hechicería Dracónica",
    "Hechicería Mecánica",
  ],
  Mago: ["Abjurador", "Adivino", "Evocador", "Ilusionista"],
  Monje: [
    "Guerrero de la Mano Abierta",
    "Guerrero de la Misericordia",
    "Guerrero de la Sombra",
    "Guerrero de los Elementos",
  ],
  "Paladín": [
    "Juramento de Entrega",
    "Juramento de Gloria",
    "Juramento de los Antiguos",
    "Juramento de Venganza",
  ],
  "Pícaro": ["Asesino", "Embaucador Arcano", "Ladrón", "Rebanaalmas"],
};

export const TRASFONDOS: string[] = [
  "Acólito",
  "Animador",
  "Artesano",
  "Campesino",
  "Charlatán",
  "Comerciante",
  "Criminal",
  "Ermitaño",
  "Erudito",
  "Escriba",
  "Guardia",
  "Guía",
  "Marinero",
  "Noble",
  "Soldado",
  "Vagabundo",
];

export const TAMANOS: string[] = [
  "Diminuto",
  "Pequeño",
  "Mediano",
  "Grande",
  "Enorme",
  "Gargantuesco",
];

export const ALINEAMIENTOS: string[] = [
  "Legal bueno",
  "Neutral bueno",
  "Caótico bueno",
  "Legal neutral",
  "Neutral",
  "Caótico neutral",
  "Legal malvado",
  "Neutral malvado",
  "Caótico malvado",
  "Sin alineamiento",
];

// Idiomas: estandar + inusuales (Manual del Jugador 2024).
export const IDIOMAS: string[] = [
  "Común",
  "Dracónico",
  "Elfo",
  "Enano",
  "Gigante",
  "Gnomo",
  "Goblin",
  "Lenguaje de signos común",
  "Mediano",
  "Orco",
  "Abisal",
  "Celestial",
  "Druídico",
  "Habla de las profundidades",
  "Infernal",
  "Infracomún",
  "Jerga de ladrones",
  "Primordial",
  "Silvano",
];

// Herramientas con las que se puede tener competencia (value === label).
export const HERRAMIENTAS: string[] = [
  "Herramientas de albañil",
  "Herramientas de alfarero",
  "Herramientas de carpintero",
  "Herramientas de cartógrafo",
  "Herramientas de curtidor",
  "Herramientas de ebanista",
  "Herramientas de herrero",
  "Herramientas de joyero",
  "Herramientas de manitas",
  "Herramientas de soplador de vidrio",
  "Herramientas de tejedor",
  "Herramientas de zapatero",
  "Suministros de alquimista",
  "Suministros de calígrafo",
  "Suministros de cervecero",
  "Suministros de pintor",
  "Herramientas de ladrón",
  "Herramientas de navegante",
  "Instrumento musical",
  "Juego",
  "Útiles de envenenador",
  "Útiles de herborista",
  "Útiles para disfrazarse",
  "Útiles para falsificar",
];

// Sistema de unidades para el display (solo visual; la hoja siempre se persiste en kg/metros).
export type Sistema = "metrico" | "imperial";

// Conversiones estandar de D&D (no las reales): 1 kg = 2 libras, 1,5 m = 5 pies.
export const KG_A_LIBRAS = 2;
export const M_A_PIES = 10 / 3;

export function pesoEnUnidad(kg: number, sistema: Sistema): number {
  return sistema === "imperial" ? kg * KG_A_LIBRAS : kg;
}

export function velocidadEnUnidad(metros: number, sistema: Sistema): number {
  return sistema === "imperial" ? metros * M_A_PIES : metros;
}

// Peso con un decimal y sufijo de unidad. Convierte desde kg segun el sistema.
export function formatPeso(kg: number, sistema: Sistema): string {
  const v = pesoEnUnidad(kg, sistema);
  const n = Math.round(v * 10) / 10;
  return `${n} ${sistema === "imperial" ? "lb" : "kg"}`;
}

// Velocidad redondeada a entero (los multiplos de 1,5 m dan pies enteros) con sufijo.
export function formatVelocidad(metros: number, sistema: Sistema): string {
  const v = Math.round(velocidadEnUnidad(metros, sistema));
  return `${v} ${sistema === "imperial" ? "pies" : "m"}`;
}

// Modificador de caracteristica: floor((puntuacion - 10) / 2).
export function modificador(puntuacion: number): number {
  return Math.floor((puntuacion - 10) / 2);
}

// Formatea un bono con signo explicito: +3, -1, +0.
export function conSigno(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`;
}

export interface SalvacionDerivada {
  caracteristica: Caracteristica;
  competente: boolean;
  total: number;
}

export function salvaciones(
  caracteristicas: Caracteristicas,
  competencia: Competencia,
): SalvacionDerivada[] {
  return CARACTERISTICAS.map((c) => {
    const competente = competencia.salvaciones.includes(c);
    const total = modificador(caracteristicas[c]) + (competente ? competencia.bono : 0);
    return { caracteristica: c, competente, total };
  });
}

export interface HabilidadDerivada {
  habilidad: Habilidad;
  caracteristica: Caracteristica;
  competente: boolean;
  total: number;
}

export function habilidades(
  caracteristicas: Caracteristicas,
  competencia: Competencia,
): HabilidadDerivada[] {
  return HABILIDADES.map((h) => {
    const car = HABILIDAD_CARACTERISTICA[h];
    const competente = competencia.habilidades.includes(h);
    const total = modificador(caracteristicas[car]) + (competente ? competencia.bono : 0);
    return { habilidad: h, caracteristica: car, competente, total };
  });
}

// Capacidad de carga (peso maximo en kg que puede transportar): Fuerza x un factor que
// depende del tamaño. Tabla "Capacidad de carga" del Manual del Jugador 2024 (08-apendices):
// Diminuto x3.75, Pequeño/Mediano x7.5, Grande x15, Enorme x30, Gargantuesco x60.
export function capacidadCarga(fuerza: number, tamano: string): number {
  const t = tamano
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const factor = t.includes("diminuto")
    ? 3.75
    : t.includes("gargant")
      ? 60
      : t.includes("enorme")
        ? 30
        : t.includes("grande")
          ? 15
          : 7.5; // pequeño/mediano por defecto
  return fuerza * factor;
}

// Percepcion pasiva: 10 + modificador de Sabiduria, sumando el bono por competencia si el
// personaje es competente en Percepcion. No se persiste, se deriva.
export function percepcionPasiva(
  caracteristicas: Caracteristicas,
  competencia: Competencia,
): number {
  const competente = competencia.habilidades.includes("percepcion");
  return 10 + modificador(caracteristicas.sabiduria) + (competente ? competencia.bono : 0);
}
