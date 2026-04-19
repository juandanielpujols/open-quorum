"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ActivarForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("t") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) return setError("Las contraseñas no coinciden");
    if (password.length < 8) return setError("Mínimo 8 caracteres");
    setLoading(true);
    const res = await fetch("/api/activar", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json();
      return setError(j.error ?? "Error");
    }
    router.push("/login?activada=1");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full border border-gray-200 rounded-lg p-2"
      />
      <input
        type="password"
        placeholder="Confirmar contraseña"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        className="w-full border border-gray-200 rounded-lg p-2"
      />
      {error && <p className="text-sb-rojo text-sm">{error}</p>}
      <button
        disabled={loading}
        type="submit"
        className="w-full bg-brand-navy text-white rounded-lg p-2 disabled:opacity-50"
      >
        {loading ? "Activando..." : "Activar"}
      </button>
    </form>
  );
}

export default function ActivarPage() {
  return (
    <main className="max-w-sm mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Activa tu cuenta</h1>
      <Suspense fallback={<p className="text-brand-muted text-sm">Cargando...</p>}>
        <ActivarForm />
      </Suspense>
    </main>
  );
}
