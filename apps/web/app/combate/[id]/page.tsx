import Link from "next/link";
import { getEncounter } from "@/lib/api";
import EncounterTracker from "./EncounterTracker";

export const dynamic = "force-dynamic";

export default async function EncounterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const encounter = await getEncounter(id);

  if (!encounter) {
    return (
      <main>
        <Link href="/combate" className="back">
          &larr; Combate
        </Link>
        <h1 className="page-title">Encuentro no encontrado</h1>
        <p className="notice">No existe un encuentro con el identificador &quot;{id}&quot;.</p>
      </main>
    );
  }

  return (
    <main>
      <Link href="/combate" className="back">
        &larr; Combate
      </Link>
      <EncounterTracker id={id} initial={encounter} />
    </main>
  );
}
