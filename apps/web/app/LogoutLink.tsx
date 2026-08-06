"use client";

import { usePathname, useRouter } from "next/navigation";

export default function LogoutLink() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/login") return null;

  const onLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <button type="button" className="logout-link" onClick={onLogout}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
      </svg>
      Cerrar sesion
    </button>
  );
}
