"use client";

import { useEffect, useState } from "react";
import type { Player, SheetListItem } from "@/lib/sheet";
import { getSheet, listPlayers, listSheets } from "@/lib/api";
import type { Combatiente, TipoCombatiente } from "@/lib/encounter";

type ResultadoMonstruo = { slug: string; nombre: string; ca: number; pg: number; iniciativa: number };

export default function AgregarCombatienteModal({ onAdd }: { onAdd: (c: Combatiente) => void }) {
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState<TipoCombatiente>("pj");
  const [sheets, setSheets] = useState<SheetListItem[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [resultadosMonstruo, setResultadosMonstruo] = useState<ResultadoMonstruo[]>([]);

  const [nombre, setNombre] = useState("");
  const [ca, setCa] = useState(10);
  const [pgMax, setPgMax] = useState(10);
  const [iniciativa, setIniciativa] = useState(0);

  useEffect(() => {
    if (!open) return;
    listSheets().then(setSheets).catch(() => setSheets([]));
    listPlayers().then(setPlayers).catch(() => setPlayers([]));
  }, [open]);

  useEffect(() => {
    if (!open || tipo !== "monstruo") return;
    const t = setTimeout(() => {
      fetch(`/api/monstruos?q=${encodeURIComponent(busqueda)}`)
        .then((r) => r.json())
        .then(setResultadosMonstruo)
        .catch(() => setResultadosMonstruo([]));
    }, 200);
    return () => clearTimeout(t);
  }, [open, tipo, busqueda]);

  const nombrePlayer = (jugadorId: string | null) => players.find((p) => p.id === jugadorId)?.nombre ?? "";

  const elegirPj = async (slug: string) => {
    const detail = await getSheet(slug);
    if (!detail) return;
    setNombre(detail.nombre);
    setCa(detail.sheet.combate.ca);
    setPgMax(detail.sheet.combate.pg_max);
    setIniciativa(detail.sheet.combate.iniciativa);
  };

  const elegirMonstruo = (m: ResultadoMonstruo) => {
    setNombre(m.nombre);
    setCa(m.ca);
    setPgMax(m.pg);
    setIniciativa(m.iniciativa);
  };

  const agregar = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({ nombre, tipo, iniciativa, ca, pg_max: pgMax, pg_actuales: pgMax, condiciones: [] });
    setOpen(false);
    setNombre("");
    setBusqueda("");
    setCa(10);
    setPgMax(10);
    setIniciativa(0);
  };

  return (
    <>
      <button type="button" className="btn" onClick={() => setOpen(true)} style={{ marginTop: 14 }}>
        + Agregar combatiente
      </button>

      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <form className="modal-card" onClick={(e) => e.stopPropagation()} onSubmit={agregar}>
            <div className="modal-head">
              <h2>Agregar combatiente</h2>
              <button type="button" className="modal-close" onClick={() => setOpen(false)} aria-label="Cerrar">
                ✕
              </button>
            </div>
            <div className="modal-body form">
              <div className="check-grid" style={{ marginBottom: 10 }}>
                <label className="check">
                  <input
                    type="radio"
                    name="tipo"
                    checked={tipo === "pj"}
                    onChange={() => setTipo("pj")}
                  />
                  Personaje
                </label>
                <label className="check">
                  <input
                    type="radio"
                    name="tipo"
                    checked={tipo === "monstruo"}
                    onChange={() => setTipo("monstruo")}
                  />
                  Monstruo
                </label>
              </div>

              {tipo === "pj" ? (
                <div className="field">
                  <span className="field-label">Elegir personaje</span>
                  <ul className="ref-list">
                    {sheets.map((s) => (
                      <li key={s.slug}>
                        <button
                          type="button"
                          className="ref-list-item"
                          style={{ width: "100%", border: "none", cursor: "pointer" }}
                          onClick={() => elegirPj(s.slug)}
                        >
                          <span className="ref-list-name">{s.nombre}</span>
                          <span className="ref-list-meta">{nombrePlayer(s.jugadorId)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="field">
                  <span className="field-label">Buscar monstruo</span>
                  <input
                    type="search"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="ej. kobold, goblin..."
                    autoFocus
                  />
                  <ul className="ref-list" style={{ marginTop: 8, maxHeight: 200, overflowY: "auto" }}>
                    {resultadosMonstruo.map((m) => (
                      <li key={m.slug}>
                        <button
                          type="button"
                          className="ref-list-item"
                          style={{ width: "100%", border: "none", cursor: "pointer" }}
                          onClick={() => elegirMonstruo(m)}
                        >
                          <span className="ref-list-name">{m.nombre}</span>
                          <span className="ref-list-meta">
                            CA {m.ca} &middot; PG {m.pg}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="form-grid" style={{ marginTop: 10 }}>
                <label className="field">
                  <span className="field-label">
                    Nombre<span className="req"> *</span>
                  </span>
                  <input required value={nombre} onChange={(e) => setNombre(e.target.value)} />
                </label>
                <label className="field">
                  <span className="field-label">CA</span>
                  <input type="number" value={ca} onChange={(e) => setCa(Number(e.target.value) || 0)} />
                </label>
                <label className="field">
                  <span className="field-label">PG máximos</span>
                  <input
                    type="number"
                    value={pgMax}
                    onChange={(e) => setPgMax(Number(e.target.value) || 0)}
                  />
                </label>
                <label className="field">
                  <span className="field-label">Iniciativa (bono)</span>
                  <input
                    type="number"
                    value={iniciativa}
                    onChange={(e) => setIniciativa(Number(e.target.value) || 0)}
                  />
                </label>
              </div>
            </div>
            <div className="modal-foot">
              <button type="button" className="btn-ghost btn" onClick={() => setOpen(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn">
                Agregar
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
