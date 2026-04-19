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

    // Compound unique con field nullable: Prisma no permite null en la where clause;
    // hacemos findFirst + update/create a mano.
    const existente = await tx.voto.findFirst({
      where: { preguntaId, userId, representandoA: null },
    });
    if (existente) {
      await tx.voto.update({
        where: { id: existente.id },
        data: {
          respuesta: respuestaValidada as Prisma.InputJsonValue,
          updatedAt: new Date(),
        },
      });
    } else {
      await tx.voto.create({
        data: {
          preguntaId,
          userId,
          representandoA: null,
          emitidoVia: "DIRECTO",
          respuesta: respuestaValidada as Prisma.InputJsonValue,
        },
      });
    }

    const total = await tx.voto.count({ where: { preguntaId } });
    eventBus.publish(canalEvento(pregunta.eventoId), {
      tipo: "voto:registrado",
      preguntaId,
      eventoId: pregunta.eventoId,
      total,
    });
    return { total };
  });
}
