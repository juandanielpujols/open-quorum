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

// 7 días por defecto — configurable si se amplía con env var
const TOKEN_VIGENCIA_MS = 7 * 24 * 60 * 60 * 1000;

export async function crearUsuarioInvitado(raw: z.infer<typeof inputSchema>) {
  const { email, nombre, rol, creadoPor } = inputSchema.parse(raw);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("Usuario con ese email ya existe");

  const tokenActivacion = randomBytes(32).toString("hex");
  return prisma.user.create({
    data: {
      email,
      nombre,
      rol: rol as Rol,
      tokenActivacion,
      tokenActivacionExpira: new Date(Date.now() + TOKEN_VIGENCIA_MS),
      creadoPor,
      activado: false,
    },
  });
}

/** Regenera el token y reinicia la ventana de expiración. Útil si venció. */
export async function regenerarTokenActivacion(userId: string) {
  const token = randomBytes(32).toString("hex");
  return prisma.user.update({
    where: { id: userId },
    data: {
      tokenActivacion: token,
      tokenActivacionExpira: new Date(Date.now() + TOKEN_VIGENCIA_MS),
    },
  });
}
