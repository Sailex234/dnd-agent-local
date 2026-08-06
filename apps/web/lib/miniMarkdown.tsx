import type { ReactNode } from "react";

// Renderiza el subconjunto de markdown que usa el corpus (parrafos con
// negrita/cursiva, listas "- " y tablas de pipes) sin agregar una dependencia
// nueva al proyecto: es un formato chico y estable (viene de libros de reglas
// que no cambian), no vale la pena sumar react-markdown para esto.

function renderInline(texto: string, keyBase: string): ReactNode[] {
  const partes: ReactNode[] = [];
  const regex = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = regex.exec(texto))) {
    if (m.index > last) partes.push(texto.slice(last, m.index));
    if (m[2] !== undefined) {
      partes.push(
        <strong key={`${keyBase}-${i}`}>
          <em>{m[2]}</em>
        </strong>
      );
    } else if (m[3] !== undefined) {
      partes.push(<strong key={`${keyBase}-${i}`}>{m[3]}</strong>);
    } else {
      partes.push(<em key={`${keyBase}-${i}`}>{m[4]}</em>);
    }
    last = regex.lastIndex;
    i++;
  }
  if (last < texto.length) partes.push(texto.slice(last));
  return partes;
}

function renderTable(lines: string[], key: string): ReactNode {
  const rows = lines
    .map((l) => l.trim())
    .filter((l) => l.startsWith("|"))
    .map((l) =>
      l
        .slice(1, l.endsWith("|") ? -1 : undefined)
        .split("|")
        .map((c) => c.trim())
    );
  const [header, sep, ...body] = rows;
  const isSep = sep && sep.every((c) => /^-*$/.test(c));
  const dataRows = isSep ? body : rows.slice(1);
  return (
    <table className="mini-md-table" key={key}>
      <thead>
        <tr>
          {header.map((c, i) => (
            <th key={i}>{renderInline(c, `${key}-h${i}`)}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {dataRows.map((row, ri) => (
          <tr key={ri}>
            {row.map((c, ci) => (
              <td key={ci}>{renderInline(c, `${key}-${ri}-${ci}`)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function MiniMarkdown({ texto }: { texto: string }) {
  if (!texto.trim()) return null;

  // Agrupa linea por linea (no solo por parrafo separado por linea en blanco):
  // una tabla o una lista puede aparecer pegada, sin blanco de por medio, al
  // texto que la precede (pasa seguido en el corpus del bestiario).
  type Bloque = { tipo: "tabla" | "lista" | "parrafo"; lines: string[] };
  const bloques: Bloque[] = [];
  for (const raw of texto.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const tipo: Bloque["tipo"] = line.startsWith("|") ? "tabla" : line.startsWith("- ") ? "lista" : "parrafo";
    const last = bloques[bloques.length - 1];
    if (last && last.tipo === tipo) last.lines.push(line);
    else bloques.push({ tipo, lines: [line] });
  }

  return (
    <>
      {bloques.map((bloque, bi) => {
        const key = `b${bi}`;
        if (bloque.tipo === "tabla") return renderTable(bloque.lines, key);
        if (bloque.tipo === "lista") {
          return (
            <ul key={key}>
              {bloque.lines.map((l, li) => (
                <li key={li}>{renderInline(l.slice(2), `${key}-${li}`)}</li>
              ))}
            </ul>
          );
        }
        return <p key={key}>{renderInline(bloque.lines.join(" "), key)}</p>;
      })}
    </>
  );
}
