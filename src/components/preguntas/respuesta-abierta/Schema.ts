import { z } from "zod";

export const ConfigRespuestaAbierta = z.object({
  maxCaracteres: z.number().int().positive().default(500),
});
export type ConfigRespuestaAbierta = z.infer<typeof ConfigRespuestaAbierta>;

export const RespuestaRespuestaAbierta = z.object({
  texto: z.string().trim().min(1).max(2000),
});
export type RespuestaRespuestaAbierta = z.infer<typeof RespuestaRespuestaAbierta>;
