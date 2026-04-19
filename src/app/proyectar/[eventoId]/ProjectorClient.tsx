"use client";
import { useEffect, useState } from "react";
import { ProjectorFrame } from "@/components/proyector/Frame";
import { ProjectorOpcionMultiple } from "@/components/preguntas/opcion-multiple/Projector";
import { ProjectorSiNo } from "@/components/preguntas/si-no/Projector";
import { ProjectorEscala } from "@/components/preguntas/escala/Projector";
import type { SnapshotEvento, SnapshotPregunta } from "@/server/snapshot";

export function ProjectorClient({
  initial,
  eventoId,
}: {
  initial: SnapshotEvento;
  eventoId: string;
}) {
  const [snap, setSnap] = useState<SnapshotEvento>(initial);

  useEffect(() => {
    const es = new EventSource(`/api/eventos/${eventoId}/stream`);
    es.onmessage = async () => {
      const r = await fetch(`/api/eventos/${eventoId}/snapshot`);
      if (r.ok) setSnap(await r.json());
    };
    return () => es.close();
  }, [eventoId]);

  const actual: SnapshotPregunta | undefined = snap.preguntas.find(
    (p) => p.estado === "ABIERTA" || p.estado === "CERRADA" || p.estado === "REVELADA",
  );

  if (!actual)
    return (
      <ProjectorFrame nombre={snap.nombre}>
        <p className="text-3xl text-sb-gris">Esperando primera pregunta...</p>
      </ProjectorFrame>
    );

  const oculto = actual.visibilidad === "OCULTO_HASTA_CERRAR" && actual.estado !== "REVELADA";

  return (
    <ProjectorFrame nombre={snap.nombre}>
      <div className="w-full max-w-5xl">
        <h2 className="text-4xl font-semibold mb-8 text-center">{actual.enunciado}</h2>
        {actual.tipo === "OPCION_MULTIPLE" && (
          <ProjectorOpcionMultiple agregado={actual.agregado as never} oculto={oculto} />
        )}
        {actual.tipo === "SI_NO" && (
          <ProjectorSiNo agregado={actual.agregado as never} oculto={oculto} />
        )}
        {actual.tipo === "ESCALA" && (
          <ProjectorEscala agregado={actual.agregado as never} oculto={oculto} />
        )}
      </div>
    </ProjectorFrame>
  );
}
