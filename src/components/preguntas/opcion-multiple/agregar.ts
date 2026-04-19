import type { Voto, Opcion } from "@/generated/prisma";
import { RespuestaOpcionMultiple } from "./Schema";

export type AgregadoOpcionMultiple = {
  total: number;
  porOpcion: Record<
    string,
    { opcionId: string; texto: string; imagenUrl: string | null; votos: number; pct: number }
  >;
};

export function agregarOpcionMultiple(
  votos: Voto[],
  opciones: Opcion[],
): AgregadoOpcionMultiple {
  const total = votos.length;
  const contador: Record<string, number> = {};
  for (const v of votos) {
    const r = RespuestaOpcionMultiple.safeParse(v.respuesta);
    if (!r.success) continue;
    for (const oid of r.data.opcionIds) contador[oid] = (contador[oid] ?? 0) + 1;
  }
  const porOpcion: AgregadoOpcionMultiple["porOpcion"] = {};
  for (const op of opciones) {
    const n = contador[op.id] ?? 0;
    porOpcion[op.id] = {
      opcionId: op.id,
      texto: op.texto,
      imagenUrl: op.imagenUrl,
      votos: n,
      pct: total ? n / total : 0,
    };
  }
  return { total, porOpcion };
}
