"use client";

import { useRef, useState } from "react";
import { updateEncounter } from "@/lib/api";
import type { Combatiente, Encounter, EncounterDetail } from "@/lib/encounter";
import { tirar } from "@/lib/dados";
import AgregarCombatienteModal from "../AgregarCombatienteModal";

type Status = "idle" | "saving" | "saved" | "error";

function ordenar(combatientes: Combatiente[]): Combatiente[] {
  return [...combatientes].sort((a, b) => b.iniciativa - a.iniciativa);
}

export default function EncounterTracker({ id, initial }: { id: string; initial: EncounterDetail }) {
  const [encounter, setEncounter] = useState<Encounter>({
    nombre: initial.nombre,
    ronda_actual: initial.ronda_actual,
    turno_actual: initial.turno_actual,
    combatientes: ordenar(initial.combatientes),
  });
  const [status, setStatus] = useState<Status>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = (next: Encounter) => {
    setStatus("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        await updateEncounter(id, next);
        setStatus("saved");
      } catch (err) {
        console.error("No se pudo guardar el encuentro:", err);
        setStatus("error");
      }
    }, 500);
  };

  const edit = (mut: (e: Encounter) => void) =>
    setEncounter((prev) => {
      const next = structuredClone(prev);
      mut(next);
      next.combatientes = ordenar(next.combatientes);
      save(next);
      return next;
    });

  const siguienteTurno = () =>
    edit((e) => {
      const total = e.combatientes.length;
      if (total === 0) return;
      const siguiente = e.turno_actual + 1;
      if (siguiente >= total) {
        e.turno_actual = 0;
        e.ronda_actual += 1;
      } else {
        e.turno_actual = siguiente;
      }
    });

  const tirarIniciativaTodos = () =>
    edit((e) => {
      for (const c of e.combatientes) c.iniciativa = tirar("1d20").total + c.iniciativa;
      e.turno_actual = 0;
    });

  return (
    <div>
      <div className="index-header">
        <div>
          <h1 className="page-title">{encounter.nombre}</h1>
          <p className="notice">
            Ronda {encounter.ronda_actual}
            {status === "saving" && <span className="save-status saving"> Guardando...</span>}
            {status === "saved" && <span className="save-status saved"> Guardado</span>}
            {status === "error" && <span className="save-status error"> Error al guardar</span>}
          </p>
        </div>
        <div className="index-actions">
          <button type="button" className="btn" onClick={tirarIniciativaTodos}>
            Tirar iniciativa (todos)
          </button>
          <button type="button" className="btn" onClick={siguienteTurno} disabled={encounter.combatientes.length === 0}>
            Siguiente turno &rarr;
          </button>
        </div>
      </div>

      <AgregarCombatienteModal onAdd={(c) => edit((e) => e.combatientes.push(c))} />

      <div className="combatientes">
        {encounter.combatientes.map((c, i) => (
          <div key={i} className={`combatiente-row ${i === encounter.turno_actual ? "turno-actual" : ""}`}>
            <span className="combatiente-turno">{i === encounter.turno_actual ? "▶" : ""}</span>
            <span className="combatiente-tipo">{c.tipo === "pj" ? "PJ" : "M"}</span>
            <input
              className="combatiente-nombre"
              value={c.nombre}
              onChange={(e) => edit((enc) => (enc.combatientes[i].nombre = e.target.value))}
            />
            <label className="combatiente-field">
              Ini
              <input
                type="number"
                value={c.iniciativa}
                onChange={(e) => edit((enc) => (enc.combatientes[i].iniciativa = Number(e.target.value) || 0))}
              />
            </label>
            <label className="combatiente-field">
              CA
              <input
                type="number"
                value={c.ca}
                onChange={(e) => edit((enc) => (enc.combatientes[i].ca = Number(e.target.value) || 0))}
              />
            </label>
            <label className="combatiente-field">
              PG
              <input
                type="number"
                value={c.pg_actuales}
                onChange={(e) => edit((enc) => (enc.combatientes[i].pg_actuales = Number(e.target.value) || 0))}
              />
              / {c.pg_max}
            </label>
            <input
              className="combatiente-condiciones"
              placeholder="condiciones (separadas por coma)"
              value={c.condiciones.join(", ")}
              onChange={(e) =>
                edit((enc) => {
                  enc.combatientes[i].condiciones = e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean);
                })
              }
            />
            <button
              type="button"
              className="btn-remove"
              onClick={() =>
                edit((enc) => {
                  enc.combatientes.splice(i, 1);
                  if (enc.turno_actual >= enc.combatientes.length) enc.turno_actual = 0;
                })
              }
            >
              Quitar
            </button>
          </div>
        ))}
        {encounter.combatientes.length === 0 && (
          <p className="notice">Sin combatientes todavía. Agregá PJs o monstruos arriba.</p>
        )}
      </div>
    </div>
  );
}
