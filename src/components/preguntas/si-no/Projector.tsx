"use client";
import type { AgregadoSiNo } from "./agregar";
import type { ChartTipo } from "../opcion-multiple/Schema";

export function ProjectorSiNo({
  agregado,
  oculto,
  chartTipo = "BARRAS_V",
}: {
  agregado: AgregadoSiNo;
  oculto: boolean;
  chartTipo?: ChartTipo;
}) {
  if (oculto)
    return (
      <div className="text-center">
        <p className="font-display text-8xl font-semibold text-brand-navy">
          {agregado.total}
        </p>
        <p className="mt-2 text-xl uppercase tracking-[0.2em] text-brand-muted">
          votos
        </p>
      </div>
    );

  const pctSi = agregado.total ? agregado.si / agregado.total : 0;
  const pctNo = 1 - pctSi;

  if (chartTipo === "NUMEROS") {
    return (
      <div className="grid w-full max-w-3xl grid-cols-2 gap-8">
        <div className="rounded-3xl border-2 border-brand-success/20 bg-brand-success/5 p-10 text-center">
          <p className="font-display text-[120px] font-bold leading-none text-brand-success-deep">
            {agregado.si}
          </p>
          <p className="mt-4 text-3xl font-semibold text-brand-success-deep">
            Sí · {(pctSi * 100).toFixed(0)}%
          </p>
        </div>
        <div className="rounded-3xl border-2 border-brand-danger/20 bg-brand-danger/5 p-10 text-center">
          <p className="font-display text-[120px] font-bold leading-none text-brand-danger-deep">
            {agregado.no}
          </p>
          <p className="mt-4 text-3xl font-semibold text-brand-danger-deep">
            No · {(pctNo * 100).toFixed(0)}%
          </p>
        </div>
      </div>
    );
  }

  if (chartTipo === "BARRAS_H") {
    const max = Math.max(agregado.si, agregado.no, 1);
    return (
      <div className="w-full max-w-4xl space-y-6">
        <div>
          <div className="mb-2 flex items-baseline justify-between text-2xl">
            <span className="font-semibold text-brand-success-deep">Sí</span>
            <span className="font-mono tabular-nums text-brand-ink">
              <span className="font-bold">{agregado.si}</span>
              <span className="ml-2 text-brand-muted">{(pctSi * 100).toFixed(0)}%</span>
            </span>
          </div>
          <div className="h-12 overflow-hidden rounded-xl bg-brand-cream-deep">
            <div
              className="h-full bg-gradient-to-r from-brand-success-deep to-brand-success transition-all duration-500 ease-out"
              style={{ width: `${(agregado.si / max) * 100}%`, minWidth: agregado.si > 0 ? "8px" : 0 }}
            />
          </div>
        </div>
        <div>
          <div className="mb-2 flex items-baseline justify-between text-2xl">
            <span className="font-semibold text-brand-danger-deep">No</span>
            <span className="font-mono tabular-nums text-brand-ink">
              <span className="font-bold">{agregado.no}</span>
              <span className="ml-2 text-brand-muted">{(pctNo * 100).toFixed(0)}%</span>
            </span>
          </div>
          <div className="h-12 overflow-hidden rounded-xl bg-brand-cream-deep">
            <div
              className="h-full bg-gradient-to-r from-brand-danger-deep to-brand-danger transition-all duration-500 ease-out"
              style={{ width: `${(agregado.no / max) * 100}%`, minWidth: agregado.no > 0 ? "8px" : 0 }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (chartTipo === "POSICIONAL_XY") {
    const xPct = pctSi * 100;
    const yPct = pctNo * 100;
    return (
      <div className="w-full max-w-3xl">
        <div className="relative mx-auto aspect-square w-full rounded-2xl border-2 border-brand-border bg-brand-cream/40">
          <div className="absolute inset-x-0 top-1/2 h-px bg-brand-border" />
          <div className="absolute inset-y-0 left-1/2 w-px bg-brand-border" />
          <span className="absolute left-1/2 top-2 -translate-x-1/2 text-xs uppercase tracking-[0.2em] text-brand-danger-deep">
            No
          </span>
          <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs uppercase tracking-[0.2em] text-brand-success-deep">
            Sí
          </span>
          <div
            className="absolute size-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-crimson shadow-lg transition-all duration-700 ease-out"
            style={{ left: `${xPct}%`, top: `${100 - yPct}%` }}
          />
        </div>
      </div>
    );
  }

  // Default: BARRAS_V (two tall bars)
  const max = Math.max(agregado.si, agregado.no, 1);
  return (
    <div className="flex h-[360px] w-full max-w-2xl items-end justify-center gap-16">
      <div className="flex flex-1 flex-col items-center gap-3">
        <span className="font-mono text-3xl font-bold tabular-nums text-brand-ink">
          {agregado.si}
        </span>
        <div
          className="w-full rounded-t-2xl bg-gradient-to-t from-brand-success-deep to-brand-success transition-all duration-500 ease-out"
          style={{ height: `${(agregado.si / max) * 100}%`, minHeight: agregado.si > 0 ? "12px" : 0 }}
        />
        <span className="font-display text-3xl font-semibold text-brand-success-deep">Sí</span>
        <span className="font-mono text-lg tabular-nums text-brand-muted">
          {(pctSi * 100).toFixed(0)}%
        </span>
      </div>
      <div className="flex flex-1 flex-col items-center gap-3">
        <span className="font-mono text-3xl font-bold tabular-nums text-brand-ink">
          {agregado.no}
        </span>
        <div
          className="w-full rounded-t-2xl bg-gradient-to-t from-brand-danger-deep to-brand-danger transition-all duration-500 ease-out"
          style={{ height: `${(agregado.no / max) * 100}%`, minHeight: agregado.no > 0 ? "12px" : 0 }}
        />
        <span className="font-display text-3xl font-semibold text-brand-danger-deep">No</span>
        <span className="font-mono text-lg tabular-nums text-brand-muted">
          {(pctNo * 100).toFixed(0)}%
        </span>
      </div>
    </div>
  );
}
