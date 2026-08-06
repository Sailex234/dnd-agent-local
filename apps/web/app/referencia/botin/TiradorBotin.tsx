"use client";

import { useState } from "react";
import { tirarEnTabla, type TablaBotin } from "@/lib/botin";

export default function TiradorBotin({ tablas, grupoLabel }: { tablas: TablaBotin[]; grupoLabel: string }) {
  const [tituloElegido, setTituloElegido] = useState(tablas[0]?.titulo ?? "");
  const [resultado, setResultado] = useState<{ valor: number; objeto: string } | null>(null);

  const tabla = tablas.find((t) => t.titulo === tituloElegido) ?? tablas[0];

  const tirar = () => {
    if (!tabla) return;
    const { valor, fila } = tirarEnTabla(tabla);
    setResultado({ valor, objeto: fila.objeto });
  };

  return (
    <div className="form botin-tirador">
      <div className="form-grid">
        <div className="field">
          <label className="field-label">{grupoLabel}</label>
          <select
            value={tituloElegido}
            onChange={(e) => {
              setTituloElegido(e.target.value);
              setResultado(null);
            }}
          >
            {tablas.map((t) => (
              <option key={t.titulo} value={t.titulo}>
                {t.titulo} ({t.dado})
              </option>
            ))}
          </select>
        </div>
      </div>
      <button type="button" className="btn" onClick={tirar} style={{ marginTop: 10 }}>
        Tirar {tabla?.dado}
      </button>
      {resultado && (
        <div className="dif-resultado">
          <strong>
            {resultado.valor}: {resultado.objeto}
          </strong>
        </div>
      )}
    </div>
  );
}
