import { describe, it, expect } from "vitest";
import { agregarEscala } from "./agregar";

describe("agregarEscala", () => {
  it("calcula promedio e histograma", () => {
    const votos = [
      { respuesta: { valor: 3 } },
      { respuesta: { valor: 5 } },
      { respuesta: { valor: 4 } },
    ] as never;
    const r = agregarEscala(votos, { min: 1, max: 5, etiquetaMin: "", etiquetaMax: "" });
    expect(r.total).toBe(3);
    expect(r.promedio).toBeCloseTo(4);
    expect(r.histograma[3]).toBe(1);
    expect(r.histograma[5]).toBe(1);
  });
  it("descarta valores fuera de rango", () => {
    const votos = [{ respuesta: { valor: 99 } }] as never;
    const r = agregarEscala(votos, { min: 1, max: 5, etiquetaMin: "", etiquetaMax: "" });
    expect(r.total).toBe(0);
  });
});
