import { z } from "zod";
import { prisma } from "@/lib/db";
import { eventBus, canalEvento } from "@/lib/eventbus";
import type { Prisma, TipoPregunta, Visibilidad } from "@/generated/prisma";
import { REGISTRY_PREGUNTAS } from "@/components/preguntas";

const crearSchema = z.object({
  eventoId: z.string(),
  tipo: z.enum(["OPCION_MULTIPLE", "SI_NO", "ESCALA", "RANKING", "NUBE_PALABRAS", "RESPUESTA_ABIERTA"]),
  enunciado: z.string().min(1).max(500),
  descripcion: z.string().optional(),
  visibilidad: z.enum(["EN_VIVO", "OCULTO_HASTA_CERRAR"]).default("OCULTO_HASTA_CERRAR"),
  configuracion: z.unknown(),
  opciones: z
    .array(
      z.object({
        texto: z.string().min(1),
        imagenUrl: z.string().url().optional(),
        esCorrecta: z.boolean().optional(),
      }),
    )
    .default([]),
});

export async function crearPregunta(raw: z.input<typeof crearSchema>) {
  const data = crearSchema.parse(raw);
  const impl = REGISTRY_PREGUNTAS[data.tipo as keyof typeof REGISTRY_PREGUNTAS];
  const configuracion = impl.schemaConfig.parse(data.configuracion);

  const opciones =
    data.tipo === "SI_NO" ? [{ texto: "Sí" }, { texto: "No" }] : data.opciones;

  const orden = await prisma.pregunta.count({ where: { eventoId: data.eventoId } });

  return prisma.pregunta.create({
    data: {
      eventoId: data.eventoId,
      tipo: data.tipo as TipoPregunta,
      enunciado: data.enunciado,
      descripcion: data.descripcion,
      visibilidad: data.visibilidad as Visibilidad,
      estado: "BORRADOR",
      configuracion: configuracion as Prisma.InputJsonValue,
      orden,
      opciones: {
        create: opciones.map((o, i) => ({
          orden: i,
          texto: o.texto,
          imagenUrl: "imagenUrl" in o ? o.imagenUrl : undefined,
          esCorrecta: "esCorrecta" in o ? !!o.esCorrecta : false,
        })),
      },
    },
    include: { opciones: true },
  });
}

async function transicion(
  preguntaId: string,
  nuevoEstado: "ABIERTA" | "CERRADA" | "REVELADA",
  adminId: string,
  tipoEvento: "pregunta:abierta" | "pregunta:cerrada" | "pregunta:revelada",
) {
  const p = await prisma.$transaction(async (tx) => {
    const extra: Record<string, Date> = {};
    if (nuevoEstado === "ABIERTA") extra.abiertaAt = new Date();
    if (nuevoEstado === "CERRADA") extra.cerradaAt = new Date();
    const pregunta = await tx.pregunta.update({
      where: { id: preguntaId },
      data: { estado: nuevoEstado, ...extra },
    });
    await tx.auditLog.create({
      data: {
        userId: adminId,
        accion: `pregunta.${nuevoEstado.toLowerCase()}`,
        targetId: preguntaId,
        metadata: { eventoId: pregunta.eventoId },
      },
    });
    return pregunta;
  });
  eventBus.publish(canalEvento(p.eventoId), {
    tipo: tipoEvento,
    preguntaId,
    eventoId: p.eventoId,
  });
  return p;
}

export const abrirPregunta = (id: string, adminId: string) =>
  transicion(id, "ABIERTA", adminId, "pregunta:abierta");
export const cerrarPregunta = (id: string, adminId: string) =>
  transicion(id, "CERRADA", adminId, "pregunta:cerrada");
export const revelarPregunta = (id: string, adminId: string) =>
  transicion(id, "REVELADA", adminId, "pregunta:revelada");

export async function eliminarPregunta(preguntaId: string) {
  return prisma.pregunta.delete({ where: { id: preguntaId } });
}

const actualizarSchema = z.object({
  enunciado: z.string().min(1).max(500),
  descripcion: z.string().optional(),
  visibilidad: z.enum(["EN_VIVO", "OCULTO_HASTA_CERRAR"]),
  configuracion: z.unknown(),
  opciones: z
    .array(
      z.object({
        texto: z.string().min(1),
        imagenUrl: z.string().url().optional(),
        esCorrecta: z.boolean().optional(),
      }),
    )
    .default([]),
});

export async function actualizarPregunta(
  preguntaId: string,
  raw: z.input<typeof actualizarSchema>,
) {
  const data = actualizarSchema.parse(raw);
  const existente = await prisma.pregunta.findUnique({ where: { id: preguntaId } });
  if (!existente) throw new Error("Pregunta no existe");
  if (existente.estado !== "BORRADOR") {
    throw new Error("Solo se puede editar una pregunta en estado BORRADOR");
  }

  const impl = REGISTRY_PREGUNTAS[existente.tipo as keyof typeof REGISTRY_PREGUNTAS];
  if (!impl) throw new Error(`Tipo ${existente.tipo} no implementado`);
  const configuracion = impl.schemaConfig.parse(data.configuracion);

  return prisma.$transaction(async (tx) => {
    // Para MC: reemplazar opciones (seguro porque BORRADOR => no hay votos).
    // Para SI_NO: reseed fijo. Para ESCALA: no tiene opciones.
    if (existente.tipo === "OPCION_MULTIPLE") {
      await tx.opcion.deleteMany({ where: { preguntaId } });
      if (data.opciones.length) {
        await tx.opcion.createMany({
          data: data.opciones.map((o, i) => ({
            preguntaId,
            orden: i,
            texto: o.texto,
            imagenUrl: o.imagenUrl,
            esCorrecta: !!o.esCorrecta,
          })),
        });
      }
    }
    return tx.pregunta.update({
      where: { id: preguntaId },
      data: {
        enunciado: data.enunciado,
        descripcion: data.descripcion,
        visibilidad: data.visibilidad as Visibilidad,
        configuracion: configuracion as Prisma.InputJsonValue,
      },
      include: { opciones: true },
    });
  });
}
