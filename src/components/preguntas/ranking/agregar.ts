import type { Voto, Opcion } from "@/generated/prisma";
import { RespuestaRanking } from "./Schema";

/**
 * Agregación por Borda count: cada posición da puntos inversos al índice.
 * Posición 1 = N puntos, posición 2 = N-1, ..., posición N = 1.
 * Orden resultante: de más-puntos a menos-puntos.
 */
export function agregarRanking(votos: Voto[], opciones: Opcion[]) {
  const puntos: Record<string, number> = {};
  for (const op of opciones) puntos[op.id] = 0;

  let totalVotos = 0;
  for (const v of votos) {
    const r = RespuestaRanking.safeParse(v.respuesta);
    if (!r.success) continue;
    totalVotos++;
    const orden = r.data.ordenOpciones;
    const n = orden.length;
    orden.forEach((opId, idx) => {
      if (puntos[opId] !== undefined) {
        puntos[opId] += n - idx;
      }
    });
  }

  const ranked = opciones
    .map((op) => ({
      opcionId: op.id,
      texto: op.texto,
      imagenUrl: op.imagenUrl,
      puntos: puntos[op.id] ?? 0,
    }))
    .sort((a, b) => b.puntos - a.puntos);

  const maxPuntos = ranked[0]?.puntos ?? 1;

  return {
    total: totalVotos,
    ranked: ranked.map((r, i) => ({ ...r, posicion: i + 1, pct: maxPuntos ? r.puntos / maxPuntos : 0 })),
  };
}
export type AgregadoRanking = ReturnType<typeof agregarRanking>;
