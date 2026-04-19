"use client";
import type { AgregadoOpcionMultiple } from "./agregar";
import type { ChartTipo } from "./Schema";

type Props = {
  agregado: AgregadoOpcionMultiple;
  oculto: boolean;
  chartTipo?: ChartTipo;
};

export function ProjectorOpcionMultiple({ agregado, oculto, chartTipo = "BARRAS_H" }: Props) {
  if (oculto)
    return (
      <div className="text-center">
        <p className="font-display text-8xl font-semibold text-brand-navy">
          {agregado.total}
        </p>
        <p className="mt-2 text-xl uppercase tracking-[0.2em] text-brand-muted">
          votos recibidos
        </p>
      </div>
    );

  const entries = Object.values(agregado.porOpcion).sort((a, b) => b.votos - a.votos);
  const max = entries[0]?.votos ?? 1;

  if (chartTipo === "NUMEROS") {
    return (
      <div className="grid w-full max-w-4xl grid-cols-2 gap-6 md:grid-cols-3">
        {entries.map((e) => (
          <div
            key={e.opcionId}
            className="rounded-2xl border-2 border-brand-border bg-brand-paper p-6 text-center"
          >
            <p className="font-display text-6xl font-bold text-brand-navy">{e.votos}</p>
            <p className="mt-1 text-sm uppercase tracking-wider text-brand-muted">
              {(e.pct * 100).toFixed(0)}%
            </p>
            <p className="mt-3 text-lg font-medium text-brand-ink">{e.texto}</p>
          </div>
        ))}
      </div>
    );
  }

  if (chartTipo === "BARRAS_V") {
    return (
      <div className="flex w-full max-w-5xl items-end justify-center gap-6" style={{ height: 360 }}>
        {entries.map((e, i) => (
          <div key={e.opcionId} className="flex flex-1 flex-col items-center gap-3">
            <span className="font-mono text-2xl font-bold tabular-nums text-brand-ink">
              {e.votos}
            </span>
            <div
              className={`w-full rounded-t-xl transition-all duration-500 ease-out ${
                i === 0
                  ? "bg-gradient-to-t from-brand-navy-deep to-brand-navy"
                  : "bg-gradient-to-t from-brand-navy-soft to-brand-navy-soft/70"
              }`}
              style={{ height: `${(e.votos / max) * 100}%`, minHeight: e.votos > 0 ? "12px" : 0 }}
            />
            <span className="line-clamp-2 text-center text-sm font-medium text-brand-ink">
              {e.texto}
            </span>
            <span className="font-mono text-xs tabular-nums text-brand-muted">
              {(e.pct * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (chartTipo === "POSICIONAL_XY" && entries.length === 2) {
    const [ejeX, ejeY] = entries;
    const totalBase = Math.max(agregado.total, 1);
    const xPct = (ejeX.votos / totalBase) * 100;
    const yPct = (ejeY.votos / totalBase) * 100;
    return (
      <div className="w-full max-w-3xl">
        <div className="relative mx-auto aspect-square w-full rounded-2xl border-2 border-brand-border bg-brand-cream/40">
          <div className="absolute inset-x-0 top-1/2 h-px bg-brand-border" />
          <div className="absolute inset-y-0 left-1/2 w-px bg-brand-border" />
          <span className="absolute left-1/2 top-2 -translate-x-1/2 text-xs uppercase tracking-[0.2em] text-brand-muted">
            {ejeY.texto}
          </span>
          <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs uppercase tracking-[0.2em] text-brand-muted">
            {ejeX.texto}
          </span>
          <div
            className="absolute size-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-crimson shadow-lg transition-all duration-700 ease-out"
            style={{
              left: `${xPct}%`,
              top: `${100 - yPct}%`,
            }}
            aria-label={`posición x=${xPct.toFixed(0)} y=${yPct.toFixed(0)}`}
          />
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="font-display text-4xl font-bold text-brand-navy">{ejeX.votos}</p>
            <p className="text-sm uppercase tracking-wider text-brand-muted">
              {ejeX.texto} · {(ejeX.pct * 100).toFixed(0)}%
            </p>
          </div>
          <div>
            <p className="font-display text-4xl font-bold text-brand-navy">{ejeY.votos}</p>
            <p className="text-sm uppercase tracking-wider text-brand-muted">
              {ejeY.texto} · {(ejeY.pct * 100).toFixed(0)}%
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Default: BARRAS_H (also fallback for POSICIONAL_XY when != 2 options)
  return (
    <div className="w-full max-w-4xl space-y-4">
      {entries.map((e, i) => (
        <div key={e.opcionId} className="flex items-center gap-4">
          {e.imagenUrl && (
            <img
              src={e.imagenUrl}
              alt={e.texto}
              className="size-20 shrink-0 rounded-xl object-cover"
            />
          )}
          <div className="flex-1">
            <div className="mb-1.5 flex items-baseline justify-between gap-4">
              <span className="text-xl font-semibold text-brand-ink">{e.texto}</span>
              <span className="font-mono text-lg tabular-nums text-brand-ink">
                <span className="font-bold">{e.votos}</span>
                <span className="ml-2 text-brand-muted">{(e.pct * 100).toFixed(0)}%</span>
              </span>
            </div>
            <div className="h-10 overflow-hidden rounded-lg bg-brand-cream-deep">
              <div
                className={`h-full transition-all duration-500 ease-out ${
                  i === 0
                    ? "bg-gradient-to-r from-brand-navy-deep to-brand-navy"
                    : "bg-gradient-to-r from-brand-navy-soft/90 to-brand-navy-soft/60"
                }`}
                style={{ width: `${(e.votos / max) * 100}%`, minWidth: e.votos > 0 ? "8px" : 0 }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
