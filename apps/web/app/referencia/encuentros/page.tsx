import Link from "next/link";
import CalculadoraEncuentro from "./CalculadoraEncuentro";

export default function EncuentrosPage() {
  return (
    <main>
      <Link href="/referencia" className="back">
        &larr; Referencia
      </Link>
      <h1 className="page-title">Dificultad de encuentros</h1>
      <p className="notice">
        Presupuesto de PX seg&uacute;n el nivel del grupo, del cap&iacute;tulo 4 de la Gu&iacute;a
        del DM. Suma las criaturas del encuentro y compar&aacute; contra el presupuesto.
      </p>
      <CalculadoraEncuentro />
    </main>
  );
}
