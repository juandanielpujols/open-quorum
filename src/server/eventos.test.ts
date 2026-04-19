import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = {
  evento: {
    create: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    findUnique: vi.fn(),
  },
  eventoInvitacion: { createMany: vi.fn(), deleteMany: vi.fn() },
};
vi.mock("@/lib/db", () => ({ prisma: mockPrisma }));

import { crearEvento, activarEvento } from "./eventos";

describe("eventos", () => {
  beforeEach(() => vi.clearAllMocks());

  it("crea evento en estado BORRADOR con modo VIVO", async () => {
    mockPrisma.evento.create.mockResolvedValue({ id: "e1", estado: "BORRADOR", modo: "VIVO" });
    await crearEvento({ nombre: "Asamblea", modo: "VIVO", creadoPor: "admin1" });
    expect(mockPrisma.evento.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          nombre: "Asamblea",
          modo: "VIVO",
          estado: "BORRADOR",
        }),
      }),
    );
  });

  it("VIVO no requiere inicioAt/cierreAt", async () => {
    mockPrisma.evento.create.mockResolvedValue({});
    await expect(
      crearEvento({ nombre: "X", modo: "VIVO", creadoPor: "a1" }),
    ).resolves.not.toThrow();
  });

  it("ASINCRONO requiere inicioAt y cierreAt", async () => {
    await expect(
      crearEvento({ nombre: "X", modo: "ASINCRONO", creadoPor: "a1" }),
    ).rejects.toThrow();
  });

  it("activar transiciona BORRADOR -> ACTIVO", async () => {
    mockPrisma.evento.findUnique.mockResolvedValue({ id: "e1", estado: "BORRADOR" });
    mockPrisma.evento.update.mockResolvedValue({ id: "e1", estado: "ACTIVO" });
    const r = await activarEvento("e1");
    expect(r.estado).toBe("ACTIVO");
  });

  it("activar falla si no está en BORRADOR", async () => {
    mockPrisma.evento.findUnique.mockResolvedValue({ id: "e1", estado: "ACTIVO" });
    await expect(activarEvento("e1")).rejects.toThrow(/estado/);
  });
});
