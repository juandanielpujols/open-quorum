import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";

/**
 * Password policy — mínimo 10 chars + complejidad.
 * Mitigación: rainbow tables para passwords débiles + diccionario común.
 * Residual: no checkea haveibeenpwned API (ver fase siguiente).
 */
export const passwordSchema = z
  .string()
  .min(10, "Mínimo 10 caracteres")
  .max(200, "Máximo 200 caracteres")
  .regex(/[A-Z]/, "Debe incluir al menos una mayúscula")
  .regex(/[a-z]/, "Debe incluir al menos una minúscula")
  .regex(/[0-9]/, "Debe incluir al menos un número");

const inputSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
});

export async function activarCuenta(raw: z.infer<typeof inputSchema>) {
  const { token, password } = inputSchema.parse(raw);
  const user = await prisma.user.findUnique({ where: { tokenActivacion: token } });

  if (!user) throw new Error("Token de activación inválido");
  if (user.activado) throw new Error("Cuenta ya activada");

  // Expiración — residual si no existe (legacy); trata como válido para
  // no bloquear usuarios pre-migración
  if (user.tokenActivacionExpira && user.tokenActivacionExpira < new Date()) {
    throw new Error("Token de activación expirado. Solicita uno nuevo al admin.");
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  return prisma.user.update({
    where: { id: user.id },
    data: {
      hashedPassword,
      activado: true,
      tokenActivacion: null,
      tokenActivacionExpira: null,
      intentosFallidos: 0,
      bloqueadoHasta: null,
    },
  });
}
