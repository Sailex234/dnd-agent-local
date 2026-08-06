"use client";

import Link from "next/link";
import { useState } from "react";
import { createPlayer } from "@/lib/api";

type State =
  | { kind: "idle" | "saving" }
  | { kind: "done"; nombre: string }
  | { kind: "error"; message: string };

export default function NuevoJugadorPage() {
  const [playerId, setPlayerId] = useState("");
  const [nombre, setNombre] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState({ kind: "saving" });
    try {
      const p = await createPlayer(playerId.trim(), nombre.trim());
      setState({ kind: "done", nombre: p.nombre });
      setPlayerId("");
      setNombre("");
    } catch (err) {
      setState({ kind: "error", message: err instanceof Error ? err.message : "Error desconocido." });
    }
  };

  return (
    <main>
      <Link href="/" className="back">
        &larr; Volver
      </Link>
      <h1 className="page-title">Cargar jugador</h1>
      <form className="form sheet" onSubmit={onSubmit}>
        <fieldset className="form-section">
          <legend>Datos del jugador</legend>
          <div className="form-grid">
            <label className="field">
              <span className="field-label">
                ID de jugador<span className="req"> *</span>
              </span>
              <input
                required
                value={playerId}
                onChange={(e) => setPlayerId(e.target.value)}
              />
            </label>
            <label className="field">
              <span className="field-label">
                Nombre<span className="req"> *</span>
              </span>
              <input required value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </label>
          </div>
        </fieldset>

        {state.kind === "error" && (
          <p className="form-error" role="alert">
            {state.message}
          </p>
        )}
        {state.kind === "done" && (
          <p className="form-ok" role="status">
            Jugador &quot;{state.nombre}&quot; cargado. Ya pod&eacute;s{" "}
            <Link href="/">crear su hoja</Link> desde el inicio.
          </p>
        )}
        <button type="submit" className="btn" disabled={state.kind === "saving"}>
          {state.kind === "saving" ? "Guardando..." : "Cargar jugador"}
        </button>
      </form>
    </main>
  );
}
