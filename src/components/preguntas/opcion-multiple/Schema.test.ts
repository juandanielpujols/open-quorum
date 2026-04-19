import { describe, it, expect } from "vitest";
import { ConfigOpcionMultiple, RespuestaOpcionMultiple } from "./Schema";

describe("OpcionMultiple schemas", () => {
  it("config default: single choice", () => {
    const parsed = ConfigOpcionMultiple.parse({});
    expect(parsed).toEqual({ permitirMultiple: false, maxSelecciones: 1, chartTipo: "BARRAS_H" });
  });
  it("respuesta requiere al menos 1 opcionId", () => {
    expect(() => RespuestaOpcionMultiple.parse({ opcionIds: [] })).toThrow();
  });
  it("respuesta válida pasa", () => {
    expect(RespuestaOpcionMultiple.parse({ opcionIds: ["o1"] })).toEqual({ opcionIds: ["o1"] });
  });
});
