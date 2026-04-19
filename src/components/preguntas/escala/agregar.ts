import type { Voto } from "@/generated/prisma";
import type { ConfigEscala } from "./Schema";
import { RespuestaEscala } from "./Schema";

export function agregarEscala(votos: Voto[], config: ConfigEscala) {
  const histograma: Record<number, number> = {};
  let suma = 0,
    n = 0;
  for (let v = config.min; v <= config.max; v++) histograma[v] = 0;
  for (const v of votos) {
    const r = RespuestaEscala.safeParse(v.respuesta);
    if (!r.success) continue;
    const val = r.data.valor;
    if (val < config.min || val > config.max) continue;
    histograma[val] = (histograma[val] ?? 0) + 1;
    suma += val;
    n++;
  }
  return { total: n, promedio: n ? suma / n : 0, histograma };
}
export type AgregadoEscala = ReturnType<typeof agregarEscala>;
