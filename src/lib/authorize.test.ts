import { describe, it, expect, vi } from "vitest";
import bcrypt from "bcryptjs";

vi.mock("./db", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from "./db";
import { authorize } from "./authorize";

describe("authorize", () => {
  it("returns null for unknown email", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const result = await authorize({ email: "x@y.com", password: "pw" });
    expect(result).toBeNull();
  });

  it("returns null for unactivated user", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "u1", email: "x@y.com", nombre: "X", rol: "VOTANTE",
      hashedPassword: await bcrypt.hash("pw", 12), activado: false,
    });
    const result = await authorize({ email: "x@y.com", password: "pw" });
    expect(result).toBeNull();
  });

  it("returns null for wrong password", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "u1", email: "x@y.com", nombre: "X", rol: "VOTANTE",
      hashedPassword: await bcrypt.hash("correcta", 12), activado: true,
    });
    const result = await authorize({ email: "x@y.com", password: "otra" });
    expect(result).toBeNull();
  });

  it("returns user data for valid credentials", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "u1", email: "x@y.com", nombre: "X", rol: "ADMIN",
      hashedPassword: await bcrypt.hash("pw", 12), activado: true,
    });
    const result = await authorize({ email: "x@y.com", password: "pw" });
    expect(result).toEqual({ id: "u1", email: "x@y.com", nombre: "X", rol: "ADMIN" });
  });
});
