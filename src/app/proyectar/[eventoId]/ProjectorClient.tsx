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
import type { ChartTipo } from "@/components/preguntas/opcion-multiple/Schema";
import { CheckCircle2, Users } from "lucide-react";

function extraerChartTipo(config: unknown): ChartTipo | undefined {
  if (config && typeof config === "object" && "chartTipo" in config) {
    const t = (config as { chartTipo?: unknown }).chartTipo;
    if (typeof t === "string") return t as ChartTipo;
  }
  return undefined;
}

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

  // Evento cerrado → pantalla de agradecimiento
  if (snap.estado === "FINALIZADO") {
    return (
      <ProjectorFrame nombre={snap.nombre}>
        <div className="flex flex-col items-center text-center">
          <CheckCircle2
            aria-hidden
            className="mb-8 size-24 text-brand-success"
            strokeWidth={1.5}
          />
          <h2 className="font-display text-7xl font-semibold leading-tight tracking-tight text-brand-ink">
            Gracias por participar
          </h2>
          <p className="mt-6 max-w-2xl text-2xl text-brand-body">
            El ejercicio ha finalizado.
          </p>
        </div>
      </ProjectorFrame>
    );
  }

  // Prioridad: ABIERTA > REVELADA > CERRADA. Dentro del mismo estado, la
  // de mayor orden (la más reciente que admin tocó). Así al abrir Q2, el
  // proyector avanza aunque Q1 esté CERRADA.
  const actual: SnapshotPregunta | undefined =
    [...snap.preguntas]
      .sort((a, b) => {
        const rank = (p: SnapshotPregunta) =>
          p.estado === "ABIERTA" ? 3 : p.estado === "REVELADA" ? 2 : p.estado === "CERRADA" ? 1 : 0;
        const dr = rank(b) - rank(a);
        return dr !== 0 ? dr : b.orden - a.orden;
      })
      .find((p) => p.estado === "ABIERTA" || p.estado === "CERRADA" || p.estado === "REVELADA");

  if (!actual)
    return (
      <ProjectorFrame nombre={snap.nombre}>
        <p className="text-3xl text-brand-muted">Esperando primera pregunta...</p>
      </ProjectorFrame>
    );

  const oculto = actual.visibilidad === "OCULTO_HASTA_CERRAR" && actual.estado !== "REVELADA";
  const chartTipo = extraerChartTipo(actual.configuracion);
  const votos = actual.totalVotos ?? 0;
  const totalInvitados = snap.totalInvitados ?? 0;
  const pct = totalInvitados > 0 ? Math.round((votos / totalInvitados) * 100) : 0;

  return (
    <ProjectorFrame nombre={snap.nombre}>
      <div className="flex w-full max-w-6xl flex-col items-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-border bg-brand-paper px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-brand-muted shadow-sm">
          <span className="font-mono tabular-nums text-brand-crimson">
            {String(actual.orden + 1).padStart(2, "0")}
          </span>
          <span>Pregunta {actual.orden + 1} de {snap.preguntas.length}</span>
        </div>
        <h2 className="mb-12 text-center font-display text-6xl font-semibold leading-[1.1] tracking-tight text-brand-ink">
          {actual.enunciado}
        </h2>
        <div className="flex w-full items-center justify-center">
          {actual.agregado == null ? (
            <p className="text-2xl text-brand-muted">Preparando resultados…</p>
          ) : null}
          {actual.agregado != null && actual.tipo === "OPCION_MULTIPLE" && (
            <ProjectorOpcionMultiple
              agregado={actual.agregado as never}
              oculto={oculto}
              chartTipo={chartTipo}
            />
          )}
          {actual.agregado != null && actual.tipo === "SI_NO" && (
            <ProjectorSiNo
              agregado={actual.agregado as never}
              oculto={oculto}
              chartTipo={chartTipo}
            />
          )}
          {actual.agregado != null && actual.tipo === "ESCALA" && (
            <ProjectorEscala agregado={actual.agregado as never} oculto={oculto} />
          )}
          {actual.agregado != null && actual.tipo === "RANKING" && (
            <ProjectorRanking agregado={actual.agregado as never} oculto={oculto} />
          )}
          {actual.agregado != null && actual.tipo === "NUBE_PALABRAS" && (
            <ProjectorNubePalabras agregado={actual.agregado as never} oculto={oculto} />
          )}
          {actual.agregado != null && actual.tipo === "RESPUESTA_ABIERTA" && (
            <ProjectorRespuestaAbierta agregado={actual.agregado as never} oculto={oculto} />
          )}
        </div>

        <div className="mt-12 flex items-center gap-4 rounded-full border-2 border-brand-border bg-brand-paper px-8 py-3 text-xl text-brand-body shadow-sm">
          <Users aria-hidden className="size-5 text-brand-muted" />
          <span className="font-mono tabular-nums">
            <span className="text-3xl font-bold text-brand-ink">{votos}</span>
            {totalInvitados > 0 && (
              <>
                <span className="text-brand-muted"> / {totalInvitados}</span>
                <span className="ml-3 text-brand-muted">({pct}%)</span>
              </>
            )}
          </span>
          <span className="text-brand-muted">
            {votos === 1 ? "persona ha votado" : "personas han votado"}
          </span>
        </div>
      </div>
    </ProjectorFrame>
  );
}
