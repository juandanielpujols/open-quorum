import { randomBytes } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import type { Rol } from "@/generated/prisma";

const inputSchema = z.object({
  email: z.string().email(),
  nombre: z.string().min(1).max(120),
  rol: z.enum(["ADMIN", "REVIEWER", "VOTANTE"]),
  creadoPor: z.string(),
});

export async function crearUsuarioInvitado(raw: z.infer<typeof inputSchema>) {
  const { email, nombre, rol, creadoPor } = inputSchema.parse(raw);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("Usuario con ese email ya existe");

  const tokenActivacion = randomBytes(32).toString("hex");
  return prisma.user.create({
    data: { email, nombre, rol: rol as Rol, tokenActivacion, creadoPor, activado: false },
  });
}
