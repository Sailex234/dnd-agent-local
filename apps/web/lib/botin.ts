import data from "@/data/botin.json";
import { rangoIncluyeTirada, tirarRango } from "./dados";

export type FilaBotin = { rango: string; objeto: string };
export type TablaBotin = { titulo: string; dado: string; filas: FilaBotin[] };
export type Botin = { objetos_magicos: TablaBotin[]; tesoros: TablaBotin[] };

const BOTIN = data as Botin;

export function tablasObjetosMagicos(): TablaBotin[] {
  return BOTIN.objetos_magicos;
}

export function tablasTesoros(): TablaBotin[] {
  return BOTIN.tesoros;
}

export function tirarEnTabla(tabla: TablaBotin): { valor: number; fila: FilaBotin } {
  const caras = parseInt(tabla.dado.replace(/^1?d/i, ""), 10);
  const valor = tirarRango(tabla.dado);
  const fila =
    tabla.filas.find((f) => rangoIncluyeTirada(f.rango, valor, caras)) ?? tabla.filas[tabla.filas.length - 1];
  return { valor, fila };
}
