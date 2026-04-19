import { describe, it, expect } from "vitest";
import { RespuestaSiNo } from "./Schema";

describe("RespuestaSiNo", () => {
  it("requiere exactamente 1 opcionId", () => {
    expect(() => RespuestaSiNo.parse({ opcionIds: [] })).toThrow();
    expect(() => RespuestaSiNo.parse({ opcionIds: ["a", "b"] })).toThrow();
    expect(RespuestaSiNo.parse({ opcionIds: ["a"] })).toEqual({ opcionIds: ["a"] });
  });
});
