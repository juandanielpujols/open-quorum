import type { Voto, Opcion } from "@/generated/prisma";
import { REGISTRY_PREGUNTAS } from "@/components/preguntas";
import { ProjectorOpcionMultiple } from "@/components/preguntas/opcion-multiple/Projector";
import { ProjectorSiNo } from "@/components/preguntas/si-no/Projector";
import { ProjectorEscala } from "@/components/preguntas/escala/Projector";

type Props = {
  tipo: string;
  configuracion: unknown;
  opciones: Opcion[];
  votos: Voto[];
};

export function ResultadoInline({ tipo, configuracion, opciones, votos }: Props) {
  const impl = REGISTRY_PREGUNTAS[tipo as keyof typeof REGISTRY_PREGUNTAS];
  if (!impl) return null;

  if (tipo === "ESCALA") {
    const config = impl.schemaConfig.parse(configuracion) as never;
    const agregado = (impl.agregar as (v: unknown, c: unknown) => unknown)(votos, config);
    return <ProjectorEscala agregado={agregado as never} oculto={false} />;
  }

  const agregado = (impl.agregar as (v: unknown, o: unknown) => unknown)(votos, opciones);

  if (tipo === "OPCION_MULTIPLE") {
    return <ProjectorOpcionMultiple agregado={agregado as never} oculto={false} />;
  }
  if (tipo === "SI_NO") {
    return <ProjectorSiNo agregado={agregado as never} oculto={false} />;
  }
  return null;
}
