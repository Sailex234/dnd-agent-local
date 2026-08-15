import Link from "next/link";
import { listEncounters } from "@/lib/api";
import CrearEncuentroModal from "./CrearEncuentroModal";
import EliminarEncuentroButton from "./EliminarEncuentroButton";

export const dynamic = "force-dynamic";

export default async function CombatePage() {
  const encuentros = await listEncounters();

  return (
    <main>
      <div className="index-header">
        <div>
          <h1 className="page-title">Combate</h1>
          <p className="notice">Rastreador de iniciativa y PG para la sesión en vivo.</p>
        </div>
        <CrearEncuentroModal />
      </div>
      {encuentros.length === 0 ? (
        <p className="notice">Todavía no hay encuentros creados.</p>
      ) : (
        <ul className="ref-list">
          {encuentros.map((e) => (
            <li key={e.id} className="ref-list-item">
              <Link href={`/combate/${e.id}`} className="ref-list-link">
                <span className="ref-list-name">{e.nombre}</span>
              </Link>
              <EliminarEncuentroButton id={e.id} nombre={e.nombre} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
