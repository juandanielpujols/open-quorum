import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: { tag: { create: vi.fn(), findMany: vi.fn(), delete: vi.fn() } },
}));

import { prisma } from "@/lib/db";
import { crearTag } from "./tags";

describe("tags", () => {
  beforeEach(() => vi.clearAllMocks());

  it("crea tag normalizando nombre (trim)", async () => {
    (prisma.tag.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "t1", nombre: "Elecciones 2026" });
    await crearTag({ nombre: "  Elecciones 2026  ", color: "#0d3048" });
    expect(prisma.tag.create).toHaveBeenCalledWith({
      data: { nombre: "Elecciones 2026", color: "#0d3048" },
    });
  });

  it("valida color hex", async () => {
    await expect(crearTag({ nombre: "x", color: "nothex" })).rejects.toThrow();
  });
});
