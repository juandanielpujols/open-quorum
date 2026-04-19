import { z } from "zod";
import { prisma } from "@/lib/db";
import { registrarAudit } from "@/lib/audit";

/**
 * Poder (voto por representación).
 *
 * Reglas del spec:
 * - Un grantor puede tener UN poder vigente por alcance (global o por evento).
 *   Otorgar uno nuevo revoca el anterior.
 * - Un proxy puede recibir múltiples poderes, con límite opcional
 *   `Evento.maxPoderesPorProxy`.
 * - Solo rol VOTANTE otorga o recibe.
 * - Grantor trumps proxy (se aplica al momento de votar, no acá).
 */

const otorgarSchema = z.object({
  grantorId: z.string(),
  proxyId: z.string(),
  eventoId: z.string().optional().nullable(), // null = global
});

export async function otorgarPoder(input: z.input<typeof otorgarSchema>) {
  const { grantorId, proxyId, eventoId } = otorgarSchema.parse(input);

  if (grantorId === proxyId) throw new Error("No puedes otorgarte poder a ti mismo");

  const [grantor, proxy] = await Promise.all([
    prisma.user.findUnique({ where: { id: grantorId } }),
    prisma.user.findUnique({ where: { id: proxyId } }),
  ]);
  if (!grantor || !proxy) throw new Error("Usuario no encontrado");
  if (grantor.rol !== "VOTANTE" || proxy.rol !== "VOTANTE") {
    throw new Error("Solo votantes pueden otorgar o recibir poderes");
  }

  // Si existe uno activo en el mismo alcance, revocarlo antes
  const existente = await prisma.poder.findFirst({
    where: {
      grantorId,
      eventoId: eventoId ?? null,
      revocadoAt: null,
    },
  });
  if (existente) {
    await prisma.poder.update({
      where: { id: existente.id },
      data: { revocadoAt: new Date() },
    });
  }

  // Validar límite por evento (si aplica)
  if (eventoId) {
    const evento = await prisma.evento.findUnique({ where: { id: eventoId } });
    if (!evento) throw new Error("Evento no existe");
    if (evento.maxPoderesPorProxy != null) {
      const activos = await prisma.poder.count({
        where: { proxyId, eventoId, revocadoAt: null },
      });
      if (activos >= evento.maxPoderesPorProxy) {
        throw new Error(
          `El proxy ya tiene el máximo de poderes (${evento.maxPoderesPorProxy}) en este evento`,
        );
      }
    }
    // Verificar que el grantor esté invitado al evento
    const invGrantor = await prisma.eventoInvitacion.findUnique({
      where: { eventoId_userId: { eventoId, userId: grantorId } },
    });
    if (!invGrantor) throw new Error("El grantor no está invitado a este evento");
  }

  const poder = await prisma.poder.create({
    data: { grantorId, proxyId, eventoId: eventoId ?? null },
  });

  await registrarAudit({
    userId: grantorId,
    accion: "branding.actualizar", // reutilizamos categoría genérica; crear acción específica en futuro
    targetId: poder.id,
    metadata: { op: "otorgar_poder", proxyId, eventoId: eventoId ?? "global" },
  });

  return poder;
}

export async function revocarPoder(poderId: string, actorId: string) {
  const poder = await prisma.poder.findUnique({ where: { id: poderId } });
  if (!poder) throw new Error("Poder no existe");
  if (poder.grantorId !== actorId) {
    throw new Error("Solo el grantor puede revocar");
  }
  if (poder.revocadoAt) return poder; // ya revocado
  const actualizado = await prisma.poder.update({
    where: { id: poderId },
    data: { revocadoAt: new Date() },
  });
  await registrarAudit({
    userId: actorId,
    accion: "branding.actualizar",
    targetId: poderId,
    metadata: { op: "revocar_poder" },
  });
  return actualizado;
}

export async function listarPoderesOtorgados(grantorId: string) {
  return prisma.poder.findMany({
    where: { grantorId, revocadoAt: null },
    include: {
      proxy: { select: { id: true, nombre: true, email: true } },
      evento: { select: { id: true, nombre: true, estado: true } },
    },
    orderBy: { otorgadoAt: "desc" },
  });
}

export async function listarPoderesRecibidos(proxyId: string) {
  return prisma.poder.findMany({
    where: { proxyId, revocadoAt: null },
    include: {
      grantor: { select: { id: true, nombre: true, email: true } },
      evento: { select: { id: true, nombre: true, estado: true } },
    },
    orderBy: { otorgadoAt: "desc" },
  });
}

/**
 * Devuelve los grantors vigentes que este proxy representa para un evento
 * específico (considera poderes globales + por-evento).
 */
export async function grantorsActivos(
  proxyId: string,
  eventoId: string,
): Promise<{ grantorId: string; grantorNombre: string }[]> {
  const poderes = await prisma.poder.findMany({
    where: {
      proxyId,
      revocadoAt: null,
      OR: [{ eventoId: null }, { eventoId }],
    },
    include: { grantor: { select: { id: true, nombre: true } } },
  });
  // De-duplicate por grantor: si hay global + específico, solo uno
  const seen = new Set<string>();
  const result: { grantorId: string; grantorNombre: string }[] = [];
  for (const p of poderes) {
    if (seen.has(p.grantorId)) continue;
    seen.add(p.grantorId);
    result.push({ grantorId: p.grantorId, grantorNombre: p.grantor.nombre });
  }
  return result;
}
