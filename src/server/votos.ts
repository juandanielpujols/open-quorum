import { z } from "zod";
import { prisma } from "@/lib/db";
import { eventBus, canalEvento } from "@/lib/eventbus";
import { REGISTRY_PREGUNTAS } from "@/components/preguntas";
import type { Prisma } from "@/generated/prisma";

const inputSchema = z.object({
  preguntaId: z.string(),
  userId: z.string(),
  respuesta: z.unknown(),
});

/**
 * Registra el voto DIRECTO del usuario y, si corresponde, replica el mismo
 * voto por cada grantor vigente que este user representa (sin pisar votos
 * directos de grantors que ya hayan votado).
 *
 * Grantor trumps proxy: si un grantor vota directamente DESPUÉS que el proxy
 * ya registró un voto por representación, el voto directo reemplaza al proxy
 * (lógica abajo: borrar cualquier voto con representandoA=grantorId cuando
 * grantor vota por su cuenta).
 */
export async function registrarVoto(raw: z.input<typeof inputSchema>) {
  const { preguntaId, userId, respuesta } = inputSchema.parse(raw);

  return prisma.$transaction(async (tx) => {
    const pregunta = await tx.pregunta.findUnique({ where: { id: preguntaId } });
    if (!pregunta) throw new Error("Pregunta no existe");
    if (pregunta.estado !== "ABIERTA")
      throw new Error(`Pregunta no está abierta (estado: ${pregunta.estado})`);

    const invitacion = await tx.eventoInvitacion.findUnique({
      where: { eventoId_userId: { eventoId: pregunta.eventoId, userId } },
    });
    if (!invitacion) throw new Error("Usuario no invitado al evento");

    const impl = REGISTRY_PREGUNTAS[pregunta.tipo as keyof typeof REGISTRY_PREGUNTAS];
    if (!impl) throw new Error(`Tipo ${pregunta.tipo} no implementado`);
    const respuestaValidada = impl.schemaRespuesta.parse(respuesta);
    const payloadJson = respuestaValidada as Prisma.InputJsonValue;

    // ===== Voto directo (upsert manual por compound unique con null) =====
    const existente = await tx.voto.findFirst({
      where: { preguntaId, userId, representandoA: null },
    });
    if (existente) {
      await tx.voto.update({
        where: { id: existente.id },
        data: { respuesta: payloadJson, updatedAt: new Date() },
      });
    } else {
      await tx.voto.create({
        data: {
          preguntaId,
          userId,
          representandoA: null,
          emitidoVia: "DIRECTO",
          respuesta: payloadJson,
        },
      });
    }

    // ===== Grantor trumps proxy =====
    // Si este user era grantor de un proxy que ya votó por él en esta pregunta,
    // eliminar ese voto por poder (el directo del grantor lo supersede).
    await tx.voto.deleteMany({
      where: {
        preguntaId,
        representandoA: userId,
      },
    });

    // ===== Replicación por poder =====
    // Encontrar grantors vigentes para los que este user es proxy (global o en este evento)
    const poderes = await tx.poder.findMany({
      where: {
        proxyId: userId,
        revocadoAt: null,
        OR: [{ eventoId: null }, { eventoId: pregunta.eventoId }],
      },
      select: { grantorId: true },
    });

    // De-dup grantors (un user con poder global + poder específico cuenta una sola vez)
    const grantors = Array.from(new Set(poderes.map((p) => p.grantorId)));

    for (const grantorId of grantors) {
      // Verificar que el grantor esté invitado al evento
      const invGrantor = await tx.eventoInvitacion.findUnique({
        where: { eventoId_userId: { eventoId: pregunta.eventoId, userId: grantorId } },
      });
      if (!invGrantor) continue;

      // Si el grantor ya votó directamente, NO replicamos (regla grantor-trumps)
      const directoDelGrantor = await tx.voto.findFirst({
        where: { preguntaId, userId: grantorId, representandoA: null },
      });
      if (directoDelGrantor) continue;

      // Upsert del voto por representación
      const existenteProxy = await tx.voto.findFirst({
        where: { preguntaId, userId, representandoA: grantorId },
      });
      if (existenteProxy) {
        await tx.voto.update({
          where: { id: existenteProxy.id },
          data: { respuesta: payloadJson, updatedAt: new Date() },
        });
      } else {
        await tx.voto.create({
          data: {
            preguntaId,
            userId,
            representandoA: grantorId,
            emitidoVia: "PODER",
            respuesta: payloadJson,
          },
        });
      }
    }

    const total = await tx.voto.count({ where: { preguntaId } });
    eventBus.publish(canalEvento(pregunta.eventoId), {
      tipo: "voto:registrado",
      preguntaId,
      eventoId: pregunta.eventoId,
      total,
    });
    return { total, representandoA: grantors };
  });
}
