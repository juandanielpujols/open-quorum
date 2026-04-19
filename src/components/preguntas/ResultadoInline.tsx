import type { Voto, Opcion } from "@/generated/prisma";
import { REGISTRY_PREGUNTAS } from "@/components/preguntas";
import { ProjectorOpcionMultiple } from "@/components/preguntas/opcion-multiple/Projector";
import { ProjectorSiNo } from "@/components/preguntas/si-no/Projector";
import { ProjectorEscala } from "@/components/preguntas/escala/Projector";
import { ProjectorRanking } from "@/components/preguntas/ranking/Projector";
import { ProjectorNubePalabras } from "@/components/preguntas/nube-palabras/Projector";
import { ProjectorRespuestaAbierta } from "@/components/preguntas/respuesta-abierta/Projector";

type Props = {
  tipo: string;
  configuracion: unknown;
  opciones: Opcion[];
  votos: Voto[];
};

export function ResultadoInline({ tipo, configuracion, opciones, votos }: Props) {
  const impl = REGISTRY_PREGUNTAS[tipo as keyof typeof REGISTRY_PREGUNTAS];
  if (!impl) return null;

  // Tipos cuya agregación depende solo de votos
  if (tipo === "NUBE_PALABRAS") {
    const agregado = (impl.agregar as (v: unknown) => unknown)(votos);
    return <ProjectorNubePalabras agregado={agregado as never} oculto={false} />;
  }
  if (tipo === "RESPUESTA_ABIERTA") {
    const agregado = (impl.agregar as (v: unknown) => unknown)(votos);
    return <ProjectorRespuestaAbierta agregado={agregado as never} oculto={false} />;
  }

  if (tipo === "ESCALA") {
    const config = impl.schemaConfig.parse(configuracion) as never;
    const agregado = (impl.agregar as (v: unknown, c: unknown) => unknown)(votos, config);
    return <ProjectorEscala agregado={agregado as never} oculto={false} />;
  }

  // Resto necesita opciones (OPCION_MULTIPLE, SI_NO, RANKING)
  const agregado = (impl.agregar as (v: unknown, o: unknown) => unknown)(votos, opciones);

  if (tipo === "OPCION_MULTIPLE") {
    return <ProjectorOpcionMultiple agregado={agregado as never} oculto={false} />;
  }
  if (tipo === "SI_NO") {
    return <ProjectorSiNo agregado={agregado as never} oculto={false} />;
  }
  if (tipo === "RANKING") {
    return <ProjectorRanking agregado={agregado as never} oculto={false} />;
  }
  return null;
}
