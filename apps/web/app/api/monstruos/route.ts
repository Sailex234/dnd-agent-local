import { NextResponse } from "next/server";
import { buscarMonstruos, caNumerica, modDestreza, pgMaximos } from "@/lib/monstruos";

// Busqueda liviana sobre los datos de referencia (server-side): el cliente no
// recibe el JSON completo de monstruos.json (~1 MB con las acciones/atributos
// de texto), solo lo que necesita el modal de "agregar combatiente".
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  const resultados = buscarMonstruos(q)
    .slice(0, 30)
    .map((m) => ({
      slug: m.slug,
      nombre: m.nombre,
      ca: caNumerica(m),
      pg: pgMaximos(m),
      iniciativa: modDestreza(m),
    }));
  return NextResponse.json(resultados);
}
