import { z } from "zod";

export const ConfigNubePalabras = z.object({
  maxCaracteres: z.number().int().positive().default(30),
  palabrasPorVotante: z.number().int().positive().default(3),
});
export type ConfigNubePalabras = z.infer<typeof ConfigNubePalabras>;

export const RespuestaNubePalabras = z.object({
  palabras: z.array(z.string().trim().min(1).max(40)).min(1).max(10),
});
export type RespuestaNubePalabras = z.infer<typeof RespuestaNubePalabras>;
