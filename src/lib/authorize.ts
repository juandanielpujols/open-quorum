import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "./db";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function authorize(raw: unknown) {
  const parsed = credentialsSchema.safeParse(raw);
  if (!parsed.success) return null;
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.hashedPassword || !user.activado) return null;

  const ok = await bcrypt.compare(password, user.hashedPassword);
  if (!ok) return null;

  return { id: user.id, email: user.email, nombre: user.nombre, rol: user.rol };
}
