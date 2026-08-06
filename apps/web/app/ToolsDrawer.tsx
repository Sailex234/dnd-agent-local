"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { KG_A_LIBRAS, M_A_PIES } from "@/lib/derive";
import UnitField from "./UnitField";

// Drawer de herramientas anclado a la izquierda. Cierra con Escape o clic afuera y
// devuelve el foco al boton que lo abrio (recibido como ref desde AppChrome).
export default function ToolsDrawer({
  open,
  onClose,
  triggerRef,
}: {
  open: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      triggerRef.current?.focus();
    };
  }, [open, onClose, triggerRef]);

  return (
    <div
      className={`drawer-overlay ${open ? "open" : ""}`}
      onClick={onClose}
      aria-hidden={!open}
      inert={!open ? true : undefined}
    >
      <div
        ref={panelRef}
        className="drawer-panel"
        role="dialog"
        aria-label="Herramientas"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="drawer-head">
          <h2>Herramientas</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>
        <div className="drawer-body">
          <section className="box">
            <h2 className="tool-title">
              <ScaleIcon />
              Peso (kg / lb)
            </h2>
            <UnitField labelA="Kilogramos" labelB="Libras" factor={KG_A_LIBRAS} />
          </section>
          <section className="box">
            <h2 className="tool-title">
              <RulerIcon />
              Distancia (m / pies)
            </h2>
            <UnitField labelA="Metros" labelB="Pies" factor={M_A_PIES} />
          </section>
          <p className="muted tool-hint">
            Escribi en cualquiera de los dos campos de una seccion: el otro se
            recalcula solo, con la conversion estandar de D&amp;D.
          </p>
          <section className="box">
            <h2 className="tool-title">
              <BookIcon />
              Referencia rápida
            </h2>
            <ul className="drawer-links">
              <li>
                <Link href="/referencia/monstruos" onClick={onClose}>
                  Monstruos
                </Link>
              </li>
              <li>
                <Link href="/referencia/glosario" onClick={onClose}>
                  Glosario (estados, acciones)
                </Link>
              </li>
              <li>
                <Link href="/referencia/encuentros" onClick={onClose}>
                  Dificultad de encuentros
                </Link>
              </li>
              <li>
                <Link href="/referencia/botin" onClick={onClose}>
                  Botín aleatorio
                </Link>
              </li>
              <li>
                <Link href="/combate" onClick={onClose}>
                  Rastreador de combate
                </Link>
              </li>
            </ul>
          </section>
        </div>
        <div className="drawer-foot">
          <p className="muted">Mas herramientas, proximamente.</p>
        </div>
      </div>
    </div>
  );
}

function ScaleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3v18M7 21h10M5 7l-3 6a3 3 0 0 0 6 0l-3-6ZM19 7l-3 6a3 3 0 0 0 6 0l-3-6ZM5 7h14M12 3l-2 4h4l-2-4Z" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13Z" />
      <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-3" />
    </svg>
  );
}

function RulerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 16.5 7.5 21 21 7.5 16.5 3 3 16.5Z" />
      <path d="m7 12 2 2M10.5 8.5l2 2M14 5l2 2" />
    </svg>
  );
}
