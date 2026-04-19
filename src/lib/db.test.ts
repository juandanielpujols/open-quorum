import { describe, it, expect } from "vitest";
import { prisma } from "./db";

describe("prisma client singleton", () => {
  it("exports a usable PrismaClient instance", () => {
    expect(prisma).toBeDefined();
    expect(typeof prisma.$connect).toBe("function");
  });
});
