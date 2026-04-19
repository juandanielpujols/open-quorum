import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";

vi.mock("./db", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from "./db";
import { authorize } from "./authorize";

const baseUser = {
  id: "u1",
  email: "x@y.com",
  nombre: "X",
  rol: "VOTANTE" as const,
  activado: true,
  intentosFallidos: 0,
  bloqueadoHasta: null as Date | null,
};

describe("authorize", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null for unknown email", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const result = await authorize({ email: "x@y.com", password: "pw" });
    expect(result).toBeNull();
  });

  it("returns null for unactivated user", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...baseUser,
      hashedPassword: await bcrypt.hash("pw", 12),
      activado: false,
    });
    const result = await authorize({ email: "x@y.com", password: "pw" });
    expect(result).toBeNull();
  });

  it("returns null for wrong password and increments attempts", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...baseUser,
      hashedPassword: await bcrypt.hash("correcta", 12),
    });
    (prisma.user.update as ReturnType<typeof vi.fn>).mockResolvedValue({});
    const result = await authorize({ email: "x@y.com", password: "otra" });
    expect(result).toBeNull();
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ intentosFallidos: 1 }),
      }),
    );
  });

  it("blocks user after 5 failed attempts", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...baseUser,
      intentosFallidos: 4,
      hashedPassword: await bcrypt.hash("correcta", 12),
    });
    (prisma.user.update as ReturnType<typeof vi.fn>).mockResolvedValue({});
    await authorize({ email: "x@y.com", password: "otra" });
    const lastCall = (prisma.user.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(lastCall.data.intentosFallidos).toBe(5);
    expect(lastCall.data.bloqueadoHasta).toBeInstanceOf(Date);
  });

  it("rejects login while user is locked", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...baseUser,
      bloqueadoHasta: new Date(Date.now() + 60_000),
      hashedPassword: await bcrypt.hash("correcta", 12),
    });
    const result = await authorize({ email: "x@y.com", password: "correcta" });
    expect(result).toBeNull();
  });

  it("returns user data for valid credentials and resets counter", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...baseUser,
      rol: "ADMIN",
      intentosFallidos: 2,
      hashedPassword: await bcrypt.hash("pw", 12),
    });
    (prisma.user.update as ReturnType<typeof vi.fn>).mockResolvedValue({});
    const result = await authorize({ email: "x@y.com", password: "pw" });
    expect(result).toEqual({ id: "u1", email: "x@y.com", nombre: "X", rol: "ADMIN" });
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { intentosFallidos: 0, bloqueadoHasta: null },
      }),
    );
  });
});
