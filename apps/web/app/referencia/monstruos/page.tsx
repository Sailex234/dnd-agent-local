import Link from "next/link";
import { buscarMonstruos } from "@/lib/monstruos";

export default async function MonstruosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const resultados = buscarMonstruos(q);
  const limitados = q ? resultados : resultados.slice(0, 200);

  return (
    <main>
      <Link href="/referencia" className="back">
        &larr; Referencia
      </Link>
      <h1 className="page-title">Monstruos</h1>
      <p className="notice">
        {resultados.length} perfiles del Manual de monstruos 2024. Busc&aacute; por nombre, tipo o
        h&aacute;bitat.
      </p>
      <form className="search-form" method="get">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="ej. kobold, dragón, Infraoscuridad..."
          className="search-input"
          autoFocus
        />
        <button type="submit" className="btn">
          Buscar
        </button>
      </form>
      <ul className="ref-list">
        {limitados.map((m) => (
          <li key={m.slug}>
            <Link href={`/referencia/monstruos/${m.slug}`} className="ref-list-item">
              <span className="ref-list-name">{m.nombre}</span>
              <span className="ref-list-meta">
                {m.tipo} {m.tamano} &middot; VD {m.vd.split(" ")[0]} &middot; CA {m.ca}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {!q && resultados.length > limitados.length && (
        <p className="notice">
          Mostrando los primeros {limitados.length} de {resultados.length}. Escrib&iacute; algo para
          buscar en el resto.
        </p>
      )}
      {q && resultados.length === 0 && <p className="notice">Sin resultados para &quot;{q}&quot;.</p>}
    </main>
  );
}
