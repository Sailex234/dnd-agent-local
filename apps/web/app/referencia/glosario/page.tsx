import Link from "next/link";
import { buscarGlosario } from "@/lib/glosario";
import { MiniMarkdown } from "@/lib/miniMarkdown";

export default async function GlosarioPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const resultados = buscarGlosario(q);

  return (
    <main>
      <Link href="/referencia" className="back">
        &larr; Referencia
      </Link>
      <h1 className="page-title">Glosario</h1>
      <p className="notice">
        Estados, acciones y reglas generales del Manual del jugador 2024. {resultados.length}{" "}
        t&eacute;rminos.
      </p>
      <form className="search-form" method="get">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="ej. aturdido, ayudar, descanso corto..."
          className="search-input"
          autoFocus
        />
        <button type="submit" className="btn">
          Buscar
        </button>
      </form>
      {resultados.length === 0 && <p className="notice">Sin resultados para &quot;{q}&quot;.</p>}
      <div className="glosario-list">
        {resultados.map((e) => (
          <div key={e.termino} className="stat-block-section glosario-entry">
            <h2>
              {e.termino}
              {e.tag && <span className="glosario-tag"> [{e.tag}]</span>}
            </h2>
            <MiniMarkdown texto={e.contenido} />
          </div>
        ))}
      </div>
    </main>
  );
}
