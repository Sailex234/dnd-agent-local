// Notacion de dados de D&D: "1d100", "2d6", "1d20+3", etc.
export type Tirada = {
  notacion: string;
  tiradas: number[];
  modificador: number;
  total: number;
};

export function tirar(notacion: string): Tirada {
  const m = notacion.trim().match(/^(\d*)d(\d+)\s*([+-]\s*\d+)?$/i);
  if (!m) throw new Error(`Notación de dados inválida: "${notacion}"`);
  const cantidad = m[1] ? parseInt(m[1], 10) : 1;
  const caras = parseInt(m[2], 10);
  const modificador = m[3] ? parseInt(m[3].replace(/\s+/g, ""), 10) : 0;

  const tiradas = Array.from({ length: cantidad }, () => 1 + Math.floor(Math.random() * caras));
  const total = tiradas.reduce((a, b) => a + b, 0) + modificador;

  return { notacion, tiradas, modificador, total };
}

// Tablas de botín usan rangos "01-10" (o un valor suelto "07") sobre 1dNN,
// con "00" representando el resultado mas alto de la tirada (100 en 1d100).
export function tirarRango(dado: string): number {
  const caras = parseInt(dado.replace(/^1?d/i, ""), 10);
  return 1 + Math.floor(Math.random() * caras);
}

export function rangoIncluyeTirada(rango: string, valor: number, caras: number): boolean {
  const partes = rango.split("-").map((p) => (p === "00" ? caras : parseInt(p, 10)));
  const [desde, hasta] = partes.length === 2 ? partes : [partes[0], partes[0]];
  return valor >= desde && valor <= hasta;
}
