import type { Voto } from "@/generated/prisma";
import { RespuestaNubePalabras } from "./Schema";

/**
 * Normaliza (lowercase + quita acentos simples) y cuenta frecuencia.
 * Trunca a las 60 palabras más populares para no saturar el render.
 */
function normalizar(s: string): string {
  return s.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function agregarNubePalabras(votos: Voto[]) {
  const conteo = new Map<string, { original: string; count: number }>();
  let totalVotos = 0;

  for (const v of votos) {
    const r = RespuestaNubePalabras.safeParse(v.respuesta);
    if (!r.success) continue;
    totalVotos++;
    for (const palabra of r.data.palabras) {
      const key = normalizar(palabra);
      if (!key) continue;
      const existing = conteo.get(key);
      if (existing) existing.count++;
      else conteo.set(key, { original: palabra.trim(), count: 1 });
    }
  }

  const top = Array.from(conteo.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 60);
  const maxCount = top[0]?.count ?? 1;

  return {
    total: totalVotos,
    palabras: top.map((p) => ({
      texto: p.original,
      count: p.count,
      peso: p.count / maxCount, // 0..1
    })),
  };
}
export type AgregadoNubePalabras = ReturnType<typeof agregarNubePalabras>;
