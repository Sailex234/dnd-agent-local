"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Player } from "@/lib/sheet";
import { emptySheet } from "@/lib/sheet";
import { createSheet, listPlayers } from "@/lib/api";

// Boton + modal de "Crear hoja", reutilizable desde la nav superior (sin jugador
// preseleccionado) y desde la vista de hojas de un jugador (con `presetJugadorId`).
export default function CrearHojaModal({
  presetJugadorId,
  triggerClassName = "btn",
  triggerLabel = "Crear hoja",
}: {
  presetJugadorId?: string;
  triggerClassName?: string;
  triggerLabel?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [userId, setUserId] = useState(presetJugadorId ?? "");
  const [nombre, setNombre] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      listPlayers().then(setPlayers).catch(() => setPlayers([]));
      setUserId(presetJugadorId ?? "");
    }
  }, [open, presetJugadorId]);

  const crear = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      const detail = await createSheet(userId, { ...emptySheet(), nombre });
      router.push(`/${detail.slug}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error desconocido.");
      setSaving(false);
    }
  };

  return (
    <>
      <button type="button" className={triggerClassName} onClick={() => setOpen(true)}>
        {triggerLabel}
      </button>

      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <form className="modal-card" onClick={(e) => e.stopPropagation()} onSubmit={crear}>
            <div className="modal-head">
              <h2>Nueva hoja</h2>
              <button type="button" className="modal-close" onClick={() => setOpen(false)} aria-label="Cerrar">
                ✕
              </button>
            </div>
            <div className="modal-body form">
              <label className="field">
                <span className="field-label">
                  Jugador<span className="req"> *</span>
                </span>
                {players.length === 0 ? (
                  <span className="muted">
                    No hay jugadores. <Link href="/jugadores/nuevo">Carga uno</Link> primero.
                  </span>
                ) : (
                  <select required value={userId} onChange={(e) => setUserId(e.target.value)}>
                    <option value="">Elegir...</option>
                    {players.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                )}
              </label>
              <label className="field">
                <span className="field-label">
                  Nombre del personaje<span className="req"> *</span>
                </span>
                <input required value={nombre} onChange={(e) => setNombre(e.target.value)} />
              </label>
              {err && (
                <p className="form-error" role="alert">
                  {err}
                </p>
              )}
            </div>
            <div className="modal-foot">
              <button type="submit" className="btn" disabled={saving}>
                {saving ? "Creando..." : "Crear y editar"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
