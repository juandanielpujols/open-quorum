import { z } from "zod";
import { prisma } from "@/lib/db";

const crearSchema = z.object({
  nombre: z.string().trim().min(1).max(80),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export async function crearTag(input: z.input<typeof crearSchema>) {
  const data = crearSchema.parse(input);
  return prisma.tag.create({ data });
}

export async function listarTags() {
  return prisma.tag.findMany({ orderBy: { nombre: "asc" } });
}

export async function eliminarTag(id: string) {
  return prisma.tag.delete({ where: { id } });
}
