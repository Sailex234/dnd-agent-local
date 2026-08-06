"use client";

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import type { Sistema } from "@/lib/derive";
import type { CharacterSheet } from "@/lib/sheet";
import SheetPdfDocument from "./SheetPdfDocument";

export default function DownloadPdfButton({
  slug,
  sheet,
  sistema,
}: {
  slug: string;
  sheet: CharacterSheet;
  sistema: Sistema;
}) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const blob = await pdf(<SheetPdfDocument sheet={sheet} sistema={sistema} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slug || "hoja"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  };

  const label = loading ? "Generando PDF..." : "Exportar a PDF";

  return (
    <button
      type="button"
      className="pdf-btn"
      onClick={handleDownload}
      disabled={loading}
      aria-label={label}
      aria-busy={loading}
      title={label}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    </button>
  );
}
