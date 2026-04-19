import type { Voto, Opcion } from "@/generated/prisma";
import { RespuestaSiNo } from "./Schema";

export function agregarSiNo(votos: Voto[], opciones: Opcion[]) {
  const total = votos.length;
  const conteo: Record<string, number> = {};
  for (const v of votos) {
    const r = RespuestaSiNo.safeParse(v.respuesta);
    if (!r.success) continue;
    const id = r.data.opcionIds[0];
    conteo[id] = (conteo[id] ?? 0) + 1;
  }
  const sí = opciones.find((o) => /^s[íi]$/i.test(o.texto));
  const no = opciones.find((o) => /^no$/i.test(o.texto));
  return {
    total,
    si: sí ? conteo[sí.id] ?? 0 : 0,
    no: no ? conteo[no.id] ?? 0 : 0,
  };
}
export type AgregadoSiNo = ReturnType<typeof agregarSiNo>;
