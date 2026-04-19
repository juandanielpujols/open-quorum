import { describe, it, expect } from "vitest";
import { agregarSiNo } from "./agregar";

describe("agregarSiNo", () => {
  it("cuenta sí/no", () => {
    const opciones = [
      { id: "s", texto: "Sí" },
      { id: "n", texto: "No" },
    ] as never;
    const votos = [
      { respuesta: { opcionIds: ["s"] } },
      { respuesta: { opcionIds: ["s"] } },
      { respuesta: { opcionIds: ["n"] } },
    ] as never;
    const r = agregarSiNo(votos, opciones);
    expect(r).toEqual({ total: 3, si: 2, no: 1 });
  });
});
