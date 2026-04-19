"use client";
import type { AgregadoNubePalabras } from "./agregar";

/**
 * Nube de palabras minimalista: sin physics engine. Tamaño por peso,
 * layout inline-flex con rotaciones aleatorias determinísticas por
 * índice (para que no "baile" entre renders).
 */
export function ProjectorNubePalabras({
  agregado,
  oculto,
}: {
  agregado: AgregadoNubePalabras;
  oculto: boolean;
}) {
  if (oculto || agregado.palabras.length === 0)
    return (
      <div className="text-center">
        <p className="text-6xl font-bold text-brand-navy">{agregado.total}</p>
        <p className="text-xl text-brand-muted">
          {agregado.total === 1 ? "respuesta" : "respuestas"}
        </p>
      </div>
    );

  const colores = ["text-brand-navy", "text-brand-crimson", "text-brand-navy-soft", "text-brand-body"];

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 py-6">
      {agregado.palabras.map((p, i) => {
        const tamMin = 18;
        const tamMax = 96;
        const size = tamMin + p.peso * (tamMax - tamMin);
        const color = colores[i % colores.length];
        return (
          <span
            key={p.texto}
            title={`${p.texto} · ${p.count}`}
            className={`font-display font-semibold leading-none tracking-tight transition-all duration-700 ease-out ${color}`}
            style={{ fontSize: `${size}px` }}
          >
            {p.texto}
          </span>
        );
      })}
    </div>
  );
}
