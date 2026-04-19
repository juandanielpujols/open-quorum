"use client";
import type { AgregadoOpcionMultiple } from "./agregar";

export function ProjectorOpcionMultiple({
  agregado,
  oculto,
}: {
  agregado: AgregadoOpcionMultiple;
  oculto: boolean;
}) {
  if (oculto)
    return (
      <div className="text-center">
        <p className="text-6xl font-bold text-sb-azul mb-4">{agregado.total}</p>
        <p className="text-xl text-sb-gris">votos recibidos</p>
      </div>
    );
  const entries = Object.values(agregado.porOpcion).sort((a, b) => b.votos - a.votos);
  const max = entries[0]?.votos ?? 1;
  return (
    <div className="space-y-3">
      {entries.map((e) => (
        <div key={e.opcionId} className="flex items-center gap-3">
          {e.imagenUrl && (
            <img
              src={e.imagenUrl}
              alt={e.texto}
              className="w-20 h-20 object-cover rounded-lg"
            />
          )}
          <div className="flex-1">
            <div className="flex items-center justify-between text-lg mb-1">
              <span className="font-medium">{e.texto}</span>
              <span>
                {e.votos} · {(e.pct * 100).toFixed(0)}%
              </span>
            </div>
            <div className="h-8 bg-sb-grisFondo rounded-lg overflow-hidden">
              <div
                className="h-full bg-sb-azul transition-all duration-500 ease-out"
                style={{ width: `${(e.votos / max) * 100}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
