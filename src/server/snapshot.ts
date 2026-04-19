import { prisma } from "@/lib/db";
import { REGISTRY_PREGUNTAS } from "@/components/preguntas";

export async function obtenerSnapshotEvento(eventoId: string) {
  const evento = await prisma.evento.findUnique({
    where: { id: eventoId },
    include: {
      preguntas: {
        orderBy: { orden: "asc" },
        include: {
          opciones: { orderBy: { orden: "asc" } },
          votos: true,
        },
      },
      _count: { select: { invitados: true } },
    },
  });
  if (!evento) return null;

  const preguntas = evento.preguntas.map((p) => {
    const impl = REGISTRY_PREGUNTAS[p.tipo as keyof typeof REGISTRY_PREGUNTAS];
    let agregado: unknown = null;
    if (impl) {
      if (p.tipo === "ESCALA") {
        const config = impl.schemaConfig.parse(p.configuracion) as never;
        agregado = (impl.agregar as (v: unknown, c: unknown) => unknown)(p.votos, config);
      } else {
        agregado = (impl.agregar as (v: unknown, o: unknown) => unknown)(p.votos, p.opciones);
      }
    }
    return {
      id: p.id,
      orden: p.orden,
      tipo: p.tipo,
      enunciado: p.enunciado,
      estado: p.estado,
      visibilidad: p.visibilidad,
      configuracion: p.configuracion,
      opciones: p.opciones,
      totalVotos: p.votos.length,
      agregado,
    };
  });

  return {
    id: evento.id,
    nombre: evento.nombre,
    estado: evento.estado,
    modo: evento.modo,
    totalInvitados: evento._count.invitados,
    preguntas,
  };
}

export type SnapshotEvento = NonNullable<Awaited<ReturnType<typeof obtenerSnapshotEvento>>>;
export type SnapshotPregunta = SnapshotEvento["preguntas"][number];
