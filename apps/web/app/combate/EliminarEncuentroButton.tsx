"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteEncounter } from "@/lib/api";

export default function EliminarEncuentroButton({ id, nombre }: { id: string; nombre: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const eliminar = async () => {
    if (!confirm(`¿Eliminar el encuentro "${nombre}"? Esta acción no se puede deshacer.`)) return;
    setDeleting(true);
    try {
      await deleteEncounter(id);
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
