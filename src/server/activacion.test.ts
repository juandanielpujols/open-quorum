import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";

vi.mock("@/lib/db", () => ({
  prisma: { user: { findUnique: vi.fn(), update: vi.fn() } },
}));

import { prisma } from "@/lib/db";
import { activarCuenta } from "./activacion";

describe("activarCuenta", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("falla si token no existe", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    await expect(activarCuenta({ token: "xxx", password: "Pass12345X" })).rejects.toThrow(/token/i);
  });

  it("falla si token es de usuario ya activado", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "u1", tokenActivacion: "xxx", activado: true,
    });
    await expect(activarCuenta({ token: "xxx", password: "Pass12345X" })).rejects.toThrow(/activada/i);
  });

  it("hashea password y activa", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "u1", tokenActivacion: "xxx", activado: false,
    });
    (prisma.user.update as ReturnType<typeof vi.fn>).mockImplementation(({ data }) => ({ id: "u1", ...data }));

    const result = await activarCuenta({ token: "xxx", password: "Pass12345X" });
    expect(result.activado).toBe(true);
    expect(result.tokenActivacion).toBeNull();
    expect(await bcrypt.compare("Pass12345X", result.hashedPassword!)).toBe(true);
  });
});
