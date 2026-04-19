"use client";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Auto-recover de errores de chunk-load: típicos tras deploy de nueva build.
    // El browser referencia hashes viejos que ya no existen en el server.
    const msg = (error.message || "").toLowerCase();
    const name = (error.name || "").toLowerCase();
    if (
      name.includes("chunkloaderror") ||
      msg.includes("chunkloaderror") ||
      msg.includes("loading chunk") ||
      msg.includes("loading css chunk") ||
      msg.includes("failed to fetch dynamically imported module")
    ) {
      // Forzar reload completo (no client navigation) para limpiar el cache.
      window.location.reload();
    }
  }, [error]);

  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="font-display text-3xl font-semibold text-brand-ink">
        Algo salió mal
      </h1>
      <p className="mt-3 text-brand-body">
        Ocurrió un error cargando esta página.
      </p>
      <div className="mt-6 flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-md bg-brand-navy px-4 py-2 text-sm font-semibold text-white hover:bg-brand-navy-deep"
        >
          Reintentar
        </button>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-md border border-brand-border px-4 py-2 text-sm font-medium text-brand-body hover:bg-brand-cream"
        >
          Recargar página
        </button>
      </div>
    </div>
  );
}
