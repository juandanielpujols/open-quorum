import { z } from "zod";

export const ChartTipo = z.enum(["NUMEROS", "BARRAS_H", "BARRAS_V", "POSICIONAL_XY"]);
export type ChartTipo = z.infer<typeof ChartTipo>;

export const ConfigOpcionMultiple = z.object({
  permitirMultiple: z.boolean().default(false),
  maxSelecciones: z.number().int().positive().default(1),
  chartTipo: ChartTipo.default("BARRAS_H"),
});
export type ConfigOpcionMultiple = z.infer<typeof ConfigOpcionMultiple>;

export const RespuestaOpcionMultiple = z.object({
  opcionIds: z.array(z.string()).min(1),
});
export type RespuestaOpcionMultiple = z.infer<typeof RespuestaOpcionMultiple>;
