"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createEncounter } from "@/lib/api";

export default function CrearEncuentroModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const crear = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      const detail = await createEncounter(nombre);
      router.push(`/combate/${detail.id}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error desconocido.");
      setSaving(false);
    }
  };

  return (
    <>
      <button type="button" className="btn" onClick={() => setOpen(true)}>
        + Nuevo encuentro
      </button>

      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <form className="modal-card" onClick={(e) => e.stopPropagation()} onSubmit={crear}>
            <div className="modal-head">
              <h2>Nuevo encuentro</h2>
              <button type="button" className="modal-close" onClick={() => setOpen(false)} aria-label="Cerrar">
                ✕
              </button>
            </div>
            <div className="modal-body form">
              <label className="field">
                <span className="field-label">
                  Nombre<span className="req"> *</span>
                </span>
                <input
                  required
                  autoFocus
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="ej. Emboscada en el puente"
                />
              </label>
              {err && (
                <p className="form-error" role="alert">
                  {err}
                </p>
              )}
            </div>
            <div className="modal-foot">
              <button type="button" className="btn-ghost btn" onClick={() => setOpen(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn" disabled={saving}>
                {saving ? "Creando..." : "Crear"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
