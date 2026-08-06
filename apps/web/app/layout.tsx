import type { Metadata } from "next";
import { Cormorant_Garamond, Libre_Baskerville } from "next/font/google";
import "./globals.css";
import AppChrome from "./AppChrome";

// Tipografia editorial (par Editorial Classic): display serif para titulos, serif
// legible para cuerpo. Se exponen como variables CSS y se usan en globals.css.
const heading = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-heading",
  display: "swap",
});
const body = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hojas de personaje - D&D 2024",
  description: "Hojas de personaje del grupo, estilo Manual del Jugador 2024.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${heading.variable} ${body.variable}`}>
      <body>
        <div className="page">
          <AppChrome />
          {children}
        </div>
      </body>
    </html>
  );
}
