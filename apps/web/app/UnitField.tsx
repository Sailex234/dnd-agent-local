"use client";

import { useState } from "react";

// Par de campos que se convierten en tiempo real en ambos sentidos: valorA * factor = valorB.
export default function UnitField({
  labelA,
  labelB,
  factor,
}: {
  labelA: string;
  labelB: string;
  factor: number;
}) {
  const [a, setA] = useState("");
  const [b, setB] = useState("");

  const round = (n: number) => Math.round(n * 100) / 100;

  const onChangeA = (v: string) => {
    setA(v);
    const n = Number(v);
    setB(v === "" || Number.isNaN(n) ? "" : String(round(n * factor)));
  };

  const onChangeB = (v: string) => {
    setB(v);
    const n = Number(v);
    setA(v === "" || Number.isNaN(n) ? "" : String(round(n / factor)));
  };

  return (
    <div className="unit-field">
      <label className="field">
        <span className="field-label">{labelA}</span>
        <input inputMode="decimal" value={a} onChange={(e) => onChangeA(e.target.value)} />
      </label>
      <label className="field">
        <span className="field-label">{labelB}</span>
        <input inputMode="decimal" value={b} onChange={(e) => onChangeB(e.target.value)} />
      </label>
    </div>
  );
}
