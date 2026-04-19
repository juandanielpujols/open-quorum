import { z } from "zod";
import { ChartTipo } from "../opcion-multiple/Schema";

export const ConfigSiNo = z.object({
  chartTipo: ChartTipo.default("BARRAS_V"),
});
export type ConfigSiNo = z.infer<typeof ConfigSiNo>;

export const RespuestaSiNo = z.object({
  opcionIds: z.array(z.string()).length(1),
});
export type RespuestaSiNo = z.infer<typeof RespuestaSiNo>;
