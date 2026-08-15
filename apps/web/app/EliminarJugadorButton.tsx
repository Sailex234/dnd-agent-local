"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deletePlayer } from "@/lib/api";

export default function EliminarJugadorButton({ playerId, nombre }: { playerId: string; nombre: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const eliminar = async () => {
    if (
      !confirm(
        `¿Eliminar a "${nombre}"? También se borran todas sus hojas de personaje. Esta acción no se puede deshacer.`,
      )
    )
      return;
    setDeleting(true);
    try {
      await deletePlayer(playerId);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error desconocido.");
      setDeleting(false);
    }
  };

  return (
    <button type="button" className="btn-remove" onClick={eliminar} disabled={deleting}>
      {deleting ? "Eliminando..." : "Eliminar"}
    </button>
  );
}
