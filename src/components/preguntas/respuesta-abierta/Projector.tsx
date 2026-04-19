"use client";
import type { AgregadoRespuestaAbierta } from "./agregar";

export function ProjectorRespuestaAbierta({
  agregado,
  oculto,
}: {
  agregado: AgregadoRespuestaAbierta;
  oculto: boolean;
}) {
  if (oculto)
    return (
      <div className="text-center">
        <p className="text-6xl font-bold text-brand-navy">{agregado.total}</p>
        <p className="text-xl text-brand-muted">respuestas recibidas</p>
      </div>
    );

  return (
    <div className="max-h-[60vh] overflow-y-auto">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {agregado.respuestas.map((r) => (
          <blockquote
            key={r.votoId}
            className="rounded-lg border border-brand-border bg-brand-cream/40 p-4 text-brand-ink"
          >
            <p className="font-display text-lg italic leading-relaxed">
              &ldquo;{r.texto}&rdquo;
            </p>
          </blockquote>
        ))}
      </div>
    </div>
  );
}
