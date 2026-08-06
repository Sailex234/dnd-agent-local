"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, password }),
      });
      if (!res.ok) {
        setError("Usuario o contrasena incorrectos.");
        setSaving(false);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("No se pudo iniciar sesion.");
      setSaving(false);
    }
  };

  return (
    <main>
      <h1 className="page-title">Iniciar sesion</h1>
      <form className="form sheet" onSubmit={onSubmit}>
        <fieldset className="form-section">
          <legend>Acceso del grupo</legend>
          <div className="form-grid">
            <label className="field">
              <span className="field-label">
                Usuario<span className="req"> *</span>
              </span>
              <input required value={user} onChange={(e) => setUser(e.target.value)} autoFocus />
            </label>
            <label className="field">
              <span className="field-label">
                Contrasena<span className="req"> *</span>
              </span>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
          </div>
        </fieldset>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn" disabled={saving}>
          {saving ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}
