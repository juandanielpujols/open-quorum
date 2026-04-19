import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    user: { create: vi.fn(), findUnique: vi.fn() },
  },
}));

import { prisma } from "@/lib/db";
import { crearUsuarioInvitado } from "./usuarios";

describe("crearUsuarioInvitado", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("genera tokenActivacion de 64 hex chars", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (prisma.user.create as ReturnType<typeof vi.fn>).mockImplementation(({ data }) => ({ id: "u1", ...data }));
    const result = await crearUsuarioInvitado({
      email: "nuevo@ejemplo.com", nombre: "Nuevo", rol: "VOTANTE", creadoPor: "admin1",
    });
    expect(result.tokenActivacion).toMatch(/^[0-9a-f]{64}$/);
    expect(result.activado).toBe(false);
  });

  it("falla si email ya existe", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "u1" });
    await expect(
      crearUsuarioInvitado({ email: "existente@x.com", nombre: "X", rol: "VOTANTE", creadoPor: "admin1" }),
    ).rejects.toThrow(/ya existe/i);
  });
});
