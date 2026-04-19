import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  pregunta: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() },
  opcion: { createMany: vi.fn() },
}));
vi.mock("@/lib/db", () => ({ prisma: mockPrisma }));
vi.mock("@/lib/eventbus", () => ({
  eventBus: { publish: vi.fn() },
  canalEvento: (id: string) => `evento:${id}`,
}));

import { crearPregunta } from "./preguntas";

describe("crearPregunta", () => {
  beforeEach(() => vi.clearAllMocks());

  it("valida config según tipo (ESCALA válida)", async () => {
    mockPrisma.pregunta.count.mockResolvedValue(0);
    mockPrisma.pregunta.create.mockResolvedValue({ id: "p1" });
    await crearPregunta({
      eventoId: "e1",
      tipo: "ESCALA",
      enunciado: "?",
      configuracion: { min: 1, max: 5, etiquetaMin: "", etiquetaMax: "" },
      visibilidad: "EN_VIVO",
      opciones: [],
    });
    expect(mockPrisma.pregunta.create).toHaveBeenCalled();
  });

  it("rechaza config inválida (ESCALA max<min)", async () => {
    mockPrisma.pregunta.count.mockResolvedValue(0);
    await expect(
      crearPregunta({
        eventoId: "e1",
        tipo: "ESCALA",
        enunciado: "?",
        configuracion: { min: 5, max: 1, etiquetaMin: "", etiquetaMax: "" },
        visibilidad: "EN_VIVO",
        opciones: [],
      }),
    ).rejects.toThrow();
  });

  it("SI_NO siembra opciones Sí/No", async () => {
    mockPrisma.pregunta.count.mockResolvedValue(0);
    mockPrisma.pregunta.create.mockResolvedValue({ id: "p1" });
    await crearPregunta({
      eventoId: "e1",
      tipo: "SI_NO",
      enunciado: "?",
      configuracion: {},
      visibilidad: "EN_VIVO",
      opciones: [],
    });
    const call = mockPrisma.pregunta.create.mock.calls[0][0];
    const opciones = call.data.opciones.create;
    expect(opciones.map((o: { texto: string }) => o.texto)).toEqual(["Sí", "No"]);
  });
});
