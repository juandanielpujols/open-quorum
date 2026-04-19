"use client";
import type { AgregadoRanking } from "./agregar";

export function ProjectorRanking({
  agregado,
  oculto,
}: {
  agregado: AgregadoRanking;
  oculto: boolean;
}) {
  if (oculto)
    return (
      <div className="text-center">
        <p className="text-6xl font-bold text-brand-navy">{agregado.total}</p>
        <p className="text-xl text-brand-muted">rankings recibidos</p>
      </div>
    );

  return (
    <div className="space-y-3">
      {agregado.ranked.map((r) => (
        <div key={r.opcionId} className="flex items-center gap-4">
          <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-lg bg-brand-cream-deep font-display text-2xl font-semibold text-brand-ink">
            {r.posicion}
          </span>
          <div className="flex-1">
            <div className="flex items-center justify-between text-lg">
              <span className="font-medium">{r.texto}</span>
              <span className="font-mono text-sm text-brand-muted">{r.puntos} pts</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-brand-cream-deep">
              <div
                className="h-full bg-brand-navy transition-all duration-500 ease-out"
                style={{ width: `${r.pct * 100}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
