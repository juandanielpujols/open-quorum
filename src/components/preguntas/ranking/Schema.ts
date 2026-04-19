import { z } from "zod";

export const ConfigRanking = z.object({
  maxItems: z.number().int().positive().optional(),
});
export type ConfigRanking = z.infer<typeof ConfigRanking>;

export const RespuestaRanking = z.object({
  ordenOpciones: z.array(z.string()).min(1),
});
export type RespuestaRanking = z.infer<typeof RespuestaRanking>;
