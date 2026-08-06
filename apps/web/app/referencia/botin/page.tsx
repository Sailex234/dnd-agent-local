import Link from "next/link";
import { tablasObjetosMagicos, tablasTesoros } from "@/lib/botin";
import TiradorBotin from "./TiradorBotin";

const TEMAS = ["Armamento", "Instrumentos", "Objetos arcanos", "Reliquias"];

export default function BotinPage() {
  const objetosMagicos = tablasObjetosMagicos();
  const tesoros = tablasTesoros();

  return (
    <main>
      <Link href="/referencia" className="back">
        &larr; Referencia
      </Link>
      <h1 className="page-title">Botín</h1>
      <p className="notice">
        Tiradas de la Gu&iacute;a del DM: objetos m&aacute;gicos aleatorios por tema y rareza, y
        piedras preciosas/obras de arte por nivel de valor.
      </p>

      <h2>Objetos mágicos aleatorios</h2>
      {TEMAS.map((tema) => {
        const tablas = objetosMagicos.filter((t) => t.titulo.startsWith(tema));
        if (tablas.length === 0) return null;
        return <TiradorBotin key={tema} tablas={tablas} grupoLabel={tema} />;
      })}

      <h2 className="section-mt">Tesoros (piedras preciosas / obras de arte)</h2>
      <TiradorBotin tablas={tesoros} grupoLabel="Tabla de tesoro" />
    </main>
  );
}
