"use client";

import { useMemo, useState } from "react";
import { PRESUPUESTO_PX } from "@/lib/dificultad";

type Criatura = { id: number; nombre: string; px: number };

export default function CalculadoraEncuentro() {
  const [jugadores, setJugadores] = useState(4);
  const [nivel, setNivel] = useState(1);
  const [criaturas, setCriaturas] = useState<Criatura[]>([]);
  const [nextId, setNextId] = useState(1);

  const presupuesto = PRESUPUESTO_PX[nivel];
  const totalPx = criaturas.reduce((sum, c) => sum + c.px, 0);

  const dificultad = useMemo(() => {
    const baja = presupuesto.baja * jugadores;
    const moderada = presupuesto.moderada * jugadores;
    const alta = presupuesto.alta * jugadores;
    if (totalPx === 0) return { etiqueta: "-", clase: "" };
    if (totalPx > alta) return { etiqueta: "Mortal (supera dificultad alta)", clase: "dif-mortal" };
    if (totalPx > moderada) return { etiqueta: "Alta", clase: "dif-alta" };
    if (totalPx > baja) return { etiqueta: "Moderada", clase: "dif-moderada" };
    return { etiqueta: "Baja", clase: "dif-baja" };
  }, [totalPx, presupuesto, jugadores]);

  return (
    <div className="form calculadora-encuentro">
      <div className="form-grid">
        <div className="field">
          <label className="field-label">Cantidad de jugadores</label>
          <input
            type="number"
            min={1}
            max={10}
            value={jugadores}
            onChange={(e) => setJugadores(Math.max(1, Number(e.target.value) || 1))}
          />
        </div>
        <div className="field">
          <label className="field-label">Nivel del grupo</label>
          <select value={nivel} onChange={(e) => setNivel(Number(e.target.value))}>
            {Object.keys(PRESUPUESTO_PX).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="stat-block-top" style={{ marginTop: 14 }}>
        <div>
          <strong>Baja</strong> {presupuesto.baja * jugadores} PX
        </div>
        <div>
          <strong>Moderada</strong> {presupuesto.moderada * jugadores} PX
        </div>
        <div>
          <strong>Alta</strong> {presupuesto.alta * jugadores} PX
        </div>
      </div>

      <div className="list-block">
        <div className="list-head">
          <span className="field-label">Criaturas del encuentro</span>
          <button
            type="button"
            className="btn-add"
            onClick={() => {
              setCriaturas([...criaturas, { id: nextId, nombre: "", px: 0 }]);
              setNextId(nextId + 1);
            }}
          >
            + Agregar
          </button>
        </div>
        {criaturas.length === 0 && (
          <p className="muted">
            Agregá las criaturas (buscalas en Referencia &gt; Monstruos para ver su PX en el campo
            VD).
          </p>
        )}
        {criaturas.map((c) => (
          <div className="list-row" key={c.id}>
            <input
              type="text"
              placeholder="Nombre"
              className="grow"
              value={c.nombre}
              onChange={(e) =>
                setCriaturas(criaturas.map((x) => (x.id === c.id ? { ...x, nombre: e.target.value } : x)))
              }
            />
            <input
              type="number"
              placeholder="PX"
              min={0}
              value={c.px || ""}
              onChange={(e) =>
                setCriaturas(
                  criaturas.map((x) => (x.id === c.id ? { ...x, px: Number(e.target.value) || 0 } : x))
                )
              }
            />
            <button
              type="button"
              className="btn-remove"
              onClick={() => setCriaturas(criaturas.filter((x) => x.id !== c.id))}
            >
              Quitar
            </button>
          </div>
        ))}
      </div>

      <div className={`dif-resultado ${dificultad.clase}`}>
        <strong>Total: {totalPx} PX</strong> &middot; Dificultad: {dificultad.etiqueta}
      </div>
    </div>
  );
}
