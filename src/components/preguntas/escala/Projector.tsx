"use client";
import type { AgregadoEscala } from "./agregar";

export function ProjectorEscala({
  agregado,
  oculto,
}: {
  agregado: AgregadoEscala;
  oculto: boolean;
}) {
  if (oculto)
    return (
      <div className="text-center">
        <p className="font-display text-8xl font-semibold text-brand-navy">
          {agregado.total}
        </p>
        <p className="mt-2 text-xl uppercase tracking-[0.2em] text-brand-muted">
          respuestas
        </p>
      </div>
    );
  const max = Math.max(...Object.values(agregado.histograma), 1);
  return (
    <div className="flex w-full items-end justify-center gap-10">
      <div className="flex h-[360px] flex-1 items-end justify-center gap-6">
        {Object.entries(agregado.histograma).map(([v, n]) => (
          <div key={v} className="flex flex-1 flex-col items-center gap-3">
            <span className="font-mono text-3xl font-bold tabular-nums text-brand-ink">
              {n}
            </span>
            <div
              className="w-full rounded-t-xl bg-gradient-to-t from-brand-navy to-brand-navy-soft transition-all duration-500 ease-out"
              style={{ height: `${(n / max) * 100}%`, minHeight: n > 0 ? "12px" : "0" }}
            />
            <span className="font-display text-2xl font-semibold text-brand-ink">
              {v}
            </span>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border-2 border-brand-navy/20 bg-brand-navy/5 px-8 py-6 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-brand-muted">
          Promedio
        </p>
        <p className="mt-1 font-display text-7xl font-bold text-brand-navy">
          {agregado.promedio.toFixed(1)}
        </p>
      </div>
    </div>
  );
}
