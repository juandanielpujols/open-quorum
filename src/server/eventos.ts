import { z } from "zod";
import { prisma } from "@/lib/db";

const crearSchema = z
  .object({
    nombre: z.string().trim().min(1).max(200),
    descripcion: z.string().optional(),
    modo: z.enum(["VIVO", "ASINCRONO"]),
    inicioAt: z.coerce.date().optional(),
    cierreAt: z.coerce.date().optional(),
    maxPoderesPorProxy: z.number().int().positive().optional(),
    creadoPor: z.string(),
    tagIds: z.array(z.string()).optional(),
  })
  .refine(
    (d) =>
      d.modo === "VIVO" || (d.inicioAt && d.cierreAt && d.cierreAt > d.inicioAt),
    {
      message: "ASINCRONO requiere inicioAt y cierreAt con cierreAt > inicioAt",
    },
  );

export async function crearEvento(input: z.input<typeof crearSchema>) {
  const data = crearSchema.parse(input);
  const { tagIds, ...rest } = data;
  return prisma.evento.create({
    data: {
      ...rest,
      estado: "BORRADOR",
      ...(tagIds
        ? { tags: { create: tagIds.map((tagId) => ({ tagId })) } }
        : {}),
    },
  });
}

export async function listarEventos() {
  return prisma.evento.findMany({
    include: {
      tags: { include: { tag: true } },
      _count: { select: { preguntas: true, invitados: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function obtenerEvento(id: string) {
  return prisma.evento.findUnique({
    where: { id },
    include: {
      preguntas: {
        orderBy: { orden: "asc" },
        include: {
          opciones: { orderBy: { orden: "asc" } },
          votos: true,
        },
      },
      invitados: { include: { user: true } },
      tags: { include: { tag: true } },
    },
  });
}

export async function activarEvento(id: string) {
  const e = await prisma.evento.findUnique({ where: { id } });
  if (!e) throw new Error("evento no existe");
  if (e.estado !== "BORRADOR") throw new Error(`estado inválido: ${e.estado}`);
  return prisma.evento.update({ where: { id }, data: { estado: "ACTIVO" } });
}

export async function finalizarEvento(id: string) {
  return prisma.evento.update({ where: { id }, data: { estado: "FINALIZADO" } });
}

export async function invitarUsuarios(eventoId: string, userIds: string[]) {
  await prisma.eventoInvitacion.createMany({
    data: userIds.map((userId) => ({ eventoId, userId })),
    skipDuplicates: true,
  });
}

export async function removerInvitacion(eventoId: string, userId: string) {
  await prisma.eventoInvitacion.deleteMany({ where: { eventoId, userId } });
}
