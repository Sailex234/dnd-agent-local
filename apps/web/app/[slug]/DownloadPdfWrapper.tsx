"use client";

import dynamic from "next/dynamic";
import type { Sistema } from "@/lib/derive";
import type { CharacterSheet } from "@/lib/sheet";

// react-pdf es client-only: el boton se carga sin SSR para que la libreria solo
// pese en el cliente al entrar a la vista de hoja.
const DownloadPdfButton = dynamic(() => import("./DownloadPdfButton"), { ssr: false });

export default function DownloadPdfWrapper({
  slug,
  sheet,
  sistema,
}: {
  slug: string;
  sheet: CharacterSheet;
  sistema: Sistema;
}) {
  return <DownloadPdfButton slug={slug} sheet={sheet} sistema={sistema} />;
}
