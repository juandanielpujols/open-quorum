import { describe, it, expect } from "vitest";
import { formatoSSE } from "./sse";

describe("formatoSSE", () => {
  it("formatea evento como SSE", () => {
    const out = formatoSSE({ tipo: "voto:registrado", preguntaId: "p1", eventoId: "e1", total: 3 });
    expect(out).toMatch(/^data: /);
    expect(out).toMatch(/\n\n$/);
    const json = JSON.parse(out.replace(/^data: /, "").replace(/\n\n$/, ""));
    expect(json).toEqual({ tipo: "voto:registrado", preguntaId: "p1", eventoId: "e1", total: 3 });
  });
});
