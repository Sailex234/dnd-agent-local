"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import LogoutLink from "./LogoutLink";
import ToolsDrawer from "./ToolsDrawer";

export default function AppChrome() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const toolsBtnRef = useRef<HTMLButtonElement>(null);

  if (pathname === "/login") return null;

  return (
    <>
      <nav className="topnav">
        <div className="topnav-inner">
          <Link href="/" className="topnav-brand">
            Hojas de personaje
          </Link>
          <div className="topnav-links">
            <Link href="/" className="topnav-link">
              <HomeIcon />
              Inicio
            </Link>
            <Link href="/combate" className="topnav-link">
              Combate
            </Link>
            <Link href="/jugadores/nuevo" className="topnav-link">
              Cargar jugador
            </Link>
            <button
              type="button"
              ref={toolsBtnRef}
              className="topnav-link topnav-btn"
              onClick={() => setDrawerOpen(true)}
            >
              <ToolsIcon />
              Herramientas
            </button>
            <LogoutLink />
          </div>
        </div>
      </nav>
      <ToolsDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} triggerRef={toolsBtnRef} />
    </>
  );
}

function HomeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 11.5 12 4l9 7.5M5 10v10h14V10" />
    </svg>
  );
}

function ToolsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14.7 6.3a4 4 0 0 1-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 1 5.4-5.4L21 6l-3-3-3.3 3.3Z" />
    </svg>
  );
}
