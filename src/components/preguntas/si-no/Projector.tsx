"use client";
import type { AgregadoSiNo } from "./agregar";

export function ProjectorSiNo({
  agregado,
  oculto,
}: {
  agregado: AgregadoSiNo;
  oculto: boolean;
}) {
  if (oculto)
    return (
      <div className="text-center">
        <p className="text-6xl font-bold text-sb-azul">{agregado.total}</p>
        <p className="text-xl text-sb-gris">votos</p>
      </div>
    );
  const pctSi = agregado.total ? agregado.si / agregado.total : 0;
  return (
    <div className="flex items-center justify-center gap-16">
      <div className="text-center">
        <p className="text-7xl font-bold text-sb-verde">{agregado.si}</p>
        <p className="text-2xl text-sb-verde">Sí ({(pctSi * 100).toFixed(0)}%)</p>
      </div>
      <div className="text-center">
        <p className="text-7xl font-bold text-sb-terracota">{agregado.no}</p>
        <p className="text-2xl text-sb-terracota">No ({((1 - pctSi) * 100).toFixed(0)}%)</p>
      </div>
    </div>
  );
}
