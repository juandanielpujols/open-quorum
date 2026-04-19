import { z } from "zod";

export const ConfigEscala = z
  .object({
    min: z.number().int().default(1),
    max: z.number().int().default(5),
    etiquetaMin: z.string().default(""),
    etiquetaMax: z.string().default(""),
  })
  .refine((d) => d.max > d.min);
export type ConfigEscala = z.infer<typeof ConfigEscala>;

export const RespuestaEscala = z.object({ valor: z.number().int() });
export type RespuestaEscala = z.infer<typeof RespuestaEscala>;
