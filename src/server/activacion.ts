import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";

const inputSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(200),
});

export async function activarCuenta(raw: z.infer<typeof inputSchema>) {
  const { token, password } = inputSchema.parse(raw);
  const user = await prisma.user.findUnique({ where: { tokenActivacion: token } });
  if (!user) throw new Error("Token de activación inválido");
  if (user.activado) throw new Error("Cuenta ya activada");

  const hashedPassword = await bcrypt.hash(password, 12);
  return prisma.user.update({
    where: { id: user.id },
    data: { hashedPassword, activado: true, tokenActivacion: null },
  });
}
