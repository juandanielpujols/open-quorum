import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = vi.hoisted(() => {
  const prisma = {
    pregunta: { findUnique: vi.fn() },
    eventoInvitacion: { findUnique: vi.fn() },
    voto: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    poder: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    $transaction: vi.fn(),
  };
  prisma.$transaction = vi.fn(async (fn: (tx: typeof prisma) => unknown) => fn(prisma));
  return prisma;
});
vi.mock("@/lib/db", () => ({ prisma: mockPrisma }));
vi.mock("@/lib/eventbus", () => ({
  eventBus: { publish: vi.fn() },
  canalEvento: (id: string) => `evento:${id}`,
}));

import { eventBus } from "@/lib/eventbus";
import { registrarVoto } from "./votos";

describe("registrarVoto", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rechaza si pregunta no está abierta", async () => {
    mockPrisma.pregunta.findUnique.mockResolvedValue({
      id: "p1",
      estado: "CERRADA",
      tipo: "SI_NO",
      eventoId: "e1",
      configuracion: {},
    });
    mockPrisma.eventoInvitacion.findUnique.mockResolvedValue({ eventoId: "e1", userId: "u1" });
    await expect(
      registrarVoto({ preguntaId: "p1", userId: "u1", respuesta: { opcionIds: ["a"] } }),
    ).rejects.toThrow(/abierta/i);
  });

  it("rechaza si usuario no está invitado", async () => {
    mockPrisma.pregunta.findUnique.mockResolvedValue({
      id: "p1",
      estado: "ABIERTA",
      tipo: "SI_NO",
      eventoId: "e1",
      configuracion: {},
    });
    mockPrisma.eventoInvitacion.findUnique.mockResolvedValue(null);
    await expect(
      registrarVoto({ preguntaId: "p1", userId: "u1", respuesta: { opcionIds: ["a"] } }),
    ).rejects.toThrow(/invitado/i);
  });

  it("valida schema de respuesta (rechaza formato inválido)", async () => {
    mockPrisma.pregunta.findUnique.mockResolvedValue({
      id: "p1",
      estado: "ABIERTA",
      tipo: "SI_NO",
      eventoId: "e1",
      configuracion: {},
    });
    mockPrisma.eventoInvitacion.findUnique.mockResolvedValue({ eventoId: "e1", userId: "u1" });
    await expect(
      registrarVoto({ preguntaId: "p1", userId: "u1", respuesta: { valor: 3 } as never }),
    ).rejects.toThrow();
  });

  it("upsert + emite voto:registrado", async () => {
    mockPrisma.pregunta.findUnique.mockResolvedValue({
      id: "p1",
      estado: "ABIERTA",
      tipo: "SI_NO",
      eventoId: "e1",
      configuracion: {},
    });
    mockPrisma.eventoInvitacion.findUnique.mockResolvedValue({ eventoId: "e1", userId: "u1" });
    mockPrisma.voto.findFirst.mockResolvedValue(null);
    mockPrisma.voto.create.mockResolvedValue({ id: "v1" });
    mockPrisma.voto.count.mockResolvedValue(5);
    await registrarVoto({ preguntaId: "p1", userId: "u1", respuesta: { opcionIds: ["a"] } });
    expect(mockPrisma.voto.create).toHaveBeenCalled();
    expect(eventBus.publish).toHaveBeenCalledWith(
      "evento:e1",
      expect.objectContaining({ tipo: "voto:registrado", total: 5 }),
    );
  });
});
