import Link from "next/link";
import { obtenerMonstruo } from "@/lib/monstruos";
import { MiniMarkdown } from "@/lib/miniMarkdown";

export default async function MonstruoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const m = obtenerMonstruo(slug);

  if (!m) {
    return (
      <main>
        <Link href="/referencia/monstruos" className="back">
          &larr; Monstruos
        </Link>
        <h1 className="page-title">Monstruo no encontrado</h1>
        <p className="notice">No existe un perfil con el identificador &quot;{slug}&quot;.</p>
      </main>
    );
  }

  return (
    <main>
      <Link href="/referencia/monstruos" className="back">
        &larr; Monstruos
      </Link>
      <div className="stat-block">
        <h1 className="page-title">{m.nombre}</h1>
        {m.tagline && <p className="stat-block-tagline">{m.tagline}</p>}
        <p className="stat-block-type">
          {m.tipo} {m.tamano}, {m.alineamiento}
        </p>
        {(m.habitat || m.tesoro) && (
          <p className="notice">
            {m.habitat && <>Hábitat: {m.habitat}. </>}
            {m.tesoro && <>Tesoro: {m.tesoro}.</>}
          </p>
        )}

        <div className="stat-block-top">
          <div>
            <strong>CA</strong> {m.ca}
          </div>
          <div>
            <strong>Iniciativa</strong> {m.iniciativa}
          </div>
          <div>
            <strong>PG</strong> {m.pg}
          </div>
          <div>
            <strong>Velocidad</strong> {m.velocidad}
          </div>
          <div>
            <strong>VD</strong> {m.vd}
          </div>
        </div>

        <table className="mini-md-table stat-block-abilities">
          <thead>
            <tr>
              <th>Car.</th>
              <th>Punt.</th>
              <th>Mod.</th>
              <th>Salv.</th>
            </tr>
          </thead>
          <tbody>
            {m.caracteristicas.map((c) => (
              <tr key={c.car}>
                <td>{c.car}</td>
                <td>{c.punt}</td>
                <td>{c.mod}</td>
                <td>{c.salv}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <ul className="stat-block-fields">
          {m.habilidades && (
            <li>
              <strong>Habilidades:</strong> {m.habilidades}
            </li>
          )}
          {m.sentidos && (
            <li>
              <strong>Sentidos:</strong> {m.sentidos}
            </li>
          )}
          {m.idiomas && (
            <li>
              <strong>Idiomas:</strong> {m.idiomas}
            </li>
          )}
          {m.equipo && (
            <li>
              <strong>Equipo:</strong> {m.equipo}
            </li>
          )}
        </ul>

        {m.secciones.map((s) => (
          <div key={s.titulo} className="stat-block-section">
            <h2>{s.titulo}</h2>
            <MiniMarkdown texto={s.texto} />
          </div>
        ))}
      </div>
    </main>
  );
}
