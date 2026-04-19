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
        <p className="text-6xl font-bold">{agregado.total}</p>
        <p className="text-xl text-sb-gris">respuestas</p>
      </div>
    );
  const max = Math.max(...Object.values(agregado.histograma), 1);
  return (
    <div className="flex items-end justify-center gap-4 h-80">
      {Object.entries(agregado.histograma).map(([v, n]) => (
        <div key={v} className="flex flex-col items-center gap-2 flex-1">
          <span className="font-semibold text-lg">{n}</span>
          <div
            className="w-full bg-sb-azul rounded-t-lg transition-all duration-500 ease-out"
            style={{ height: `${(n / max) * 100}%` }}
          />
          <span className="text-xl font-medium">{v}</span>
        </div>
      ))}
      <div className="ml-4 text-center">
        <p className="text-sm text-sb-gris">Promedio</p>
        <p className="text-5xl font-bold text-sb-azul">{agregado.promedio.toFixed(1)}</p>
      </div>
    </div>
  );
}
