import { describe, it, expect } from "vitest";
import { agregarOpcionMultiple } from "./agregar";

describe("agregarOpcionMultiple", () => {
  it("cuenta votos por opción", () => {
    const opciones = [
      { id: "a", preguntaId: "p1", orden: 0, texto: "A", imagenUrl: null, esCorrecta: false },
      { id: "b", preguntaId: "p1", orden: 1, texto: "B", imagenUrl: null, esCorrecta: false },
    ] as never;
    const votos = [
      { respuesta: { opcionIds: ["a"] } },
      { respuesta: { opcionIds: ["a"] } },
      { respuesta: { opcionIds: ["b"] } },
    ] as never;
    const r = agregarOpcionMultiple(votos, opciones);
    expect(r.total).toBe(3);
    expect(r.porOpcion["a"].votos).toBe(2);
    expect(r.porOpcion["b"].votos).toBe(1);
    expect(r.porOpcion["a"].pct).toBeCloseTo(2 / 3);
  });

  it("multi-select suma cada opción escogida", () => {
    const opciones = [
      { id: "a", preguntaId: "p1", orden: 0, texto: "A", imagenUrl: null, esCorrecta: false },
      { id: "b", preguntaId: "p1", orden: 1, texto: "B", imagenUrl: null, esCorrecta: false },
    ] as never;
    const votos = [{ respuesta: { opcionIds: ["a", "b"] } }] as never;
    const r = agregarOpcionMultiple(votos, opciones);
    expect(r.total).toBe(1);
    expect(r.porOpcion["a"].votos).toBe(1);
    expect(r.porOpcion["b"].votos).toBe(1);
  });
});
