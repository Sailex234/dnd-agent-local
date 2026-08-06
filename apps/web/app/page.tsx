import Link from "next/link";
import { listPlayers, listSheets } from "@/lib/api";
import CrearHojaModal from "./CrearHojaModal";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [players, sheets] = await Promise.all([listPlayers(), listSheets()]);
  const sheetsByJugador = new Map<string, typeof sheets>();
  for (const s of sheets) {
    if (!s.jugadorId) continue;
    const list = sheetsByJugador.get(s.jugadorId) ?? [];
    list.push(s);
    sheetsByJugador.set(s.jugadorId, list);
  }

  return (
    <main>
      <div className="index-header">
        <div>
          <h1 className="page-title">Jugadores</h1>
          <p className="notice">Grupo de D&amp;D 2024. Cada jugador con sus personajes.</p>
        </div>
      </div>
      {players.length === 0 ? (
        <p className="notice">
          Todav&iacute;a no hay jugadores cargados. Carg&aacute; uno desde la nav superior.
        </p>
      ) : (
        <ul className="player-groups">
          {players.map((p) => {
            const propias = sheetsByJugador.get(p.id) ?? [];
            return (
              <li key={p.id} className="player-group">
                <div className="player-group-head">
                  <span className="card-name">{p.nombre}</span>
                  <CrearHojaModal
                    presetJugadorId={p.id}
                    triggerClassName="btn-add"
                    triggerLabel="+ Crear hoja"
                  />
                </div>
                {propias.length === 0 ? (
                  <p className="muted">Sin personajes todav&iacute;a.</p>
                ) : (
                  <ul className="sheet-chip-list">
                    {propias.map((s) => (
                      <li key={s.slug}>
                        <Link href={`/${s.slug}`} className="btn">
                          {s.nombre}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
