import type { Voto } from "@/generated/prisma";
import { RespuestaRespuestaAbierta } from "./Schema";

export function agregarRespuestaAbierta(votos: Voto[]) {
  const respuestas: { texto: string; votoId: string; createdAt: Date }[] = [];
  for (const v of votos) {
    const r = RespuestaRespuestaAbierta.safeParse(v.respuesta);
    if (!r.success) continue;
    respuestas.push({
      texto: r.data.texto,
      votoId: v.id,
      createdAt: v.createdAt,
    });
  }
  // Más recientes primero para animación en proyector
  respuestas.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return {
    total: respuestas.length,
    respuestas,
  };
}
export type AgregadoRespuestaAbierta = ReturnType<typeof agregarRespuestaAbierta>;
