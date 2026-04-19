import { z } from "zod";

export const ConfigSiNo = z.object({});
export type ConfigSiNo = z.infer<typeof ConfigSiNo>;

export const RespuestaSiNo = z.object({
  opcionIds: z.array(z.string()).length(1),
});
export type RespuestaSiNo = z.infer<typeof RespuestaSiNo>;
