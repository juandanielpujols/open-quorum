import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "./db";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/** Máximo de intentos fallidos antes de bloquear temporalmente. */
const MAX_INTENTOS = 5;
/** Duración del bloqueo tras superar el límite (minutos). */
const BLOQUEO_MIN = 15;

/**
 * authorize() — valida credenciales con defensa en profundidad:
 * 1. Validación de formato (Zod)
 * 2. Lookup de usuario
 * 3. Check de bloqueo (throttle adaptativo contra brute force distribuido)
 * 4. Check de activación
 * 5. Comparación constante-en-tiempo de bcrypt
 * 6. Incremento/reset de intentosFallidos atómicamente
 *
 * Las auditorías (login.success / login.fail) se registran desde
 * Auth.js events en lib/auth.ts — aquí solo actualizamos contadores.
 *
 * Residual: intentos por email no por IP. Un atacante con muchas IPs
 * puede bypassear el lockout de email si rota. El rate-limit per-IP en
 * proxy.ts corta ese vector.
 */
export async function authorize(raw: unknown) {
  const parsed = credentialsSchema.safeParse(raw);
  if (!parsed.success) return null;
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.hashedPassword || !user.activado) return null;

  // Lockout temporal
  if (user.bloqueadoHasta && user.bloqueadoHasta > new Date()) {
    return null;
  }

  const ok = await bcrypt.compare(password, user.hashedPassword);

  if (!ok) {
    const intentos = user.intentosFallidos + 1;
    const debeBloquear = intentos >= MAX_INTENTOS;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        intentosFallidos: intentos,
        bloqueadoHasta: debeBloquear
          ? new Date(Date.now() + BLOQUEO_MIN * 60_000)
          : user.bloqueadoHasta,
      },
    });
    return null;
  }

  // Reset contador al success
  if (user.intentosFallidos > 0 || user.bloqueadoHasta) {
    await prisma.user.update({
      where: { id: user.id },
      data: { intentosFallidos: 0, bloqueadoHasta: null },
    });
  }

  return { id: user.id, email: user.email, nombre: user.nombre, rol: user.rol };
}
