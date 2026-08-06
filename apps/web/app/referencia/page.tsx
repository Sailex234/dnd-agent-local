import Link from "next/link";

export default function ReferenciaPage() {
  return (
    <main>
      <Link href="/" className="back">
        &larr; Inicio
      </Link>
      <h1 className="page-title">Referencia rápida</h1>
      <p className="notice">
        Consulta instantánea para la mesa: sin IA, sin espera, directo del Manual de monstruos, la
        Guía del DM y el Manual del jugador 2024.
      </p>
      <div className="ref-nav-grid">
        <Link href="/referencia/monstruos" className="ref-nav-card">
          <h2>Monstruos</h2>
          <p>407 perfiles del bestiario, con CA, PG, acciones y reacciones completas.</p>
        </Link>
        <Link href="/referencia/glosario" className="ref-nav-card">
          <h2>Glosario</h2>
          <p>Estados, acciones y reglas de descanso, tal como las define el Manual del jugador.</p>
        </Link>
        <Link href="/referencia/encuentros" className="ref-nav-card">
          <h2>Encuentros</h2>
          <p>Calculadora de dificultad por presupuesto de PX según el nivel del grupo.</p>
        </Link>
        <Link href="/referencia/botin" className="ref-nav-card">
          <h2>Botín</h2>
          <p>Tiradas de tesoro y objetos mágicos aleatorios por rareza.</p>
        </Link>
      </div>
    </main>
  );
}
