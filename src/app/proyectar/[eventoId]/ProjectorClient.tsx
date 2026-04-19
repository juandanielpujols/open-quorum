"use client";
import { useEffect, useState } from "react";
import { ProjectorFrame } from "@/components/proyector/Frame";
import { ProjectorOpcionMultiple } from "@/components/preguntas/opcion-multiple/Projector";
import { ProjectorSiNo } from "@/components/preguntas/si-no/Projector";
import { ProjectorEscala } from "@/components/preguntas/escala/Projector";
import { ProjectorRanking } from "@/components/preguntas/ranking/Projector";
import { ProjectorNubePalabras } from "@/components/preguntas/nube-palabras/Projector";
import { ProjectorRespuestaAbierta } from "@/components/preguntas/respuesta-abierta/Projector";
import type { SnapshotEvento, SnapshotPregunta } from "@/server/snapshot";
import { Users } from "lucide-react";

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
        <p className="text-3xl text-brand-muted">Esperando primera pregunta...</p>
      </ProjectorFrame>
    );

  const oculto = actual.visibilidad === "OCULTO_HASTA_CERRAR" && actual.estado !== "REVELADA";
  const votos = actual.totalVotos ?? 0;
  const totalInvitados = snap.totalInvitados ?? 0;
  const pct = totalInvitados > 0 ? Math.round((votos / totalInvitados) * 100) : 0;

  return (
    <ProjectorFrame nombre={snap.nombre}>
      <div className="flex w-full max-w-5xl flex-col items-center">
        <h2 className="mb-8 text-center font-display text-4xl font-semibold leading-tight text-brand-ink">
          {actual.enunciado}
        </h2>
        <div className="w-full">
          {actual.tipo === "OPCION_MULTIPLE" && (
            <ProjectorOpcionMultiple agregado={actual.agregado as never} oculto={oculto} />
          )}
          {actual.tipo === "SI_NO" && (
            <ProjectorSiNo agregado={actual.agregado as never} oculto={oculto} />
          )}
          {actual.tipo === "ESCALA" && (
            <ProjectorEscala agregado={actual.agregado as never} oculto={oculto} />
          )}
          {actual.tipo === "RANKING" && (
            <ProjectorRanking agregado={actual.agregado as never} oculto={oculto} />
          )}
          {actual.tipo === "NUBE_PALABRAS" && (
            <ProjectorNubePalabras agregado={actual.agregado as never} oculto={oculto} />
          )}
          {actual.tipo === "RESPUESTA_ABIERTA" && (
            <ProjectorRespuestaAbierta agregado={actual.agregado as never} oculto={oculto} />
          )}
        </div>

        <div className="mt-10 flex items-center gap-3 rounded-full border border-brand-border bg-brand-cream px-5 py-2.5 text-lg text-brand-body shadow-sm">
          <Users aria-hidden className="size-4 text-brand-muted" />
          <span className="font-mono tabular-nums">
            <span className="font-semibold text-brand-ink">{votos}</span>
            {totalInvitados > 0 && (
              <>
                <span className="text-brand-muted"> / {totalInvitados}</span>
                <span className="ml-3 text-sm text-brand-muted">({pct}%)</span>
              </>
            )}
          </span>
          <span className="text-sm text-brand-muted">
            {votos === 1 ? "persona ha votado" : "personas han votado"}
          </span>
        </div>
      </div>
    </ProjectorFrame>
  );
}
