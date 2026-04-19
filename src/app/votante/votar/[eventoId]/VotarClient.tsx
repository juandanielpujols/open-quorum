"use client";
import { useEffect, useState } from "react";
import { VoterOpcionMultiple } from "@/components/preguntas/opcion-multiple/Voter";
import { VoterSiNo } from "@/components/preguntas/si-no/Voter";
import { VoterEscala } from "@/components/preguntas/escala/Voter";
import { VoterRanking } from "@/components/preguntas/ranking/Voter";
import { VoterNubePalabras } from "@/components/preguntas/nube-palabras/Voter";
import { VoterRespuestaAbierta } from "@/components/preguntas/respuesta-abierta/Voter";
import { ProjectorOpcionMultiple } from "@/components/preguntas/opcion-multiple/Projector";
import { ProjectorSiNo } from "@/components/preguntas/si-no/Projector";
import { ProjectorEscala } from "@/components/preguntas/escala/Projector";
import { ProjectorRanking } from "@/components/preguntas/ranking/Projector";
import { ProjectorNubePalabras } from "@/components/preguntas/nube-palabras/Projector";
import { ProjectorRespuestaAbierta } from "@/components/preguntas/respuesta-abierta/Projector";
import type { SnapshotEvento, SnapshotPregunta } from "@/server/snapshot";
import type { ChartTipo } from "@/components/preguntas/opcion-multiple/Schema";
import { CheckCircle2, Eye } from "lucide-react";

function extraerChartTipo(config: unknown): ChartTipo | undefined {
  if (config && typeof config === "object" && "chartTipo" in config) {
    const t = (config as { chartTipo?: unknown }).chartTipo;
    if (typeof t === "string") return t as ChartTipo;
  }
  return undefined;
}

function ResultadosLive({ pregunta }: { pregunta: SnapshotPregunta }) {
  const oculto =
    pregunta.visibilidad === "OCULTO_HASTA_CERRAR" && pregunta.estado !== "REVELADA";
  const chartTipo = extraerChartTipo(pregunta.configuracion);

  // El endpoint /snapshot borra `agregado` para votantes en preguntas ocultas.
  // No hay nada que renderizar: mostramos placeholder.
  if (pregunta.agregado == null) {
    return (
      <div className="mt-6 rounded-2xl border border-dashed border-brand-border bg-brand-cream/50 p-6 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-brand-muted">
          Resultados ocultos
        </p>
        <p className="mt-2 text-sm text-brand-muted">
          Los resultados se mostrarán cuando el administrador los revele.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-2xl border border-brand-border bg-brand-paper p-6">
      <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-brand-muted">
        <Eye aria-hidden className="size-3.5" />
        {pregunta.estado === "REVELADA" ? "Resultados revelados" : "Resultados en vivo"}
      </div>
      {pregunta.tipo === "OPCION_MULTIPLE" && (
        <ProjectorOpcionMultiple
          agregado={pregunta.agregado as never}
          oculto={oculto}
          chartTipo={chartTipo}
        />
      )}
      {pregunta.tipo === "SI_NO" && (
        <ProjectorSiNo
          agregado={pregunta.agregado as never}
          oculto={oculto}
          chartTipo={chartTipo}
        />
      )}
      {pregunta.tipo === "ESCALA" && (
        <ProjectorEscala agregado={pregunta.agregado as never} oculto={oculto} />
      )}
      {pregunta.tipo === "RANKING" && (
        <ProjectorRanking agregado={pregunta.agregado as never} oculto={oculto} />
      )}
      {pregunta.tipo === "NUBE_PALABRAS" && (
        <ProjectorNubePalabras agregado={pregunta.agregado as never} oculto={oculto} />
      )}
      {pregunta.tipo === "RESPUESTA_ABIERTA" && (
        <ProjectorRespuestaAbierta agregado={pregunta.agregado as never} oculto={oculto} />
      )}
    </div>
  );
}

export function VotarClient({
  initial,
  eventoId,
}: {
  initial: SnapshotEvento;
  eventoId: string;
}) {
  const [snap, setSnap] = useState<SnapshotEvento>(initial);
  const [votada, setVotada] = useState<Set<string>>(new Set());

  useEffect(() => {
    const es = new EventSource(`/api/eventos/${eventoId}/stream`);
    es.onmessage = async () => {
      const r = await fetch(`/api/eventos/${eventoId}/snapshot`);
      if (r.ok) setSnap(await r.json());
    };
    return () => es.close();
  }, [eventoId]);

  // Evento finalizado → pantalla de gracias
  if (snap.estado === "FINALIZADO") {
    const preguntasReveladas = snap.mostrarResultadosFinales
      ? snap.preguntas.filter((p) => p.estado === "REVELADA")
      : [];
    return (
      <div className="mx-auto max-w-xl space-y-6 px-4 py-10">
        <div className="rounded-2xl border border-brand-border bg-brand-paper p-8 text-center">
          <CheckCircle2
            aria-hidden
            className="mx-auto mb-4 size-12 text-brand-success"
            strokeWidth={1.5}
          />
          <h1 className="font-display text-3xl font-semibold text-brand-ink">
            Gracias por participar
          </h1>
          <p className="mt-2 text-brand-body">{snap.nombre} · ejercicio finalizado</p>
        </div>
        {preguntasReveladas.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-brand-muted">
              Resultados revelados
            </h2>
            {preguntasReveladas.map((p) => (
              <div key={p.id} className="rounded-2xl border border-brand-border bg-brand-paper p-5">
                <p className="mb-4 font-display text-xl font-semibold text-brand-ink">
                  {p.enunciado}
                </p>
                <ResultadosLive pregunta={p} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Pregunta ABIERTA (prioridad máxima: la más reciente por orden)
  const abierta: SnapshotPregunta | undefined =
    [...snap.preguntas]
      .sort((a, b) => b.orden - a.orden)
      .find((p) => p.estado === "ABIERTA");

  async function enviarVoto(respuesta: unknown) {
    if (!abierta) return;
    const r = await fetch("/api/votos", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ preguntaId: abierta.id, respuesta }),
    });
    if (!r.ok) throw new Error((await r.json()).error ?? "error");
    setVotada((prev) => new Set(prev).add(abierta.id));
  }

  // Si no hay abierta pero hay una REVELADA reciente, mostrar esa
  const revelada: SnapshotPregunta | undefined =
    [...snap.preguntas]
      .sort((a, b) => b.orden - a.orden)
      .find((p) => p.estado === "REVELADA");

  if (!abierta && !revelada)
    return (
      <div className="mx-auto max-w-xl px-4 py-10 text-center">
        <h1 className="mb-3 font-display text-2xl font-semibold text-brand-ink">
          {snap.nombre}
        </h1>
        <p className="text-brand-muted">Esperando próxima pregunta...</p>
      </div>
    );

  if (!abierta && revelada) {
    return (
      <div className="mx-auto max-w-xl px-4 py-8">
        <h1 className="mb-6 text-center font-display text-2xl font-semibold text-brand-ink">
          {snap.nombre}
        </h1>
        <div className="rounded-2xl border border-brand-border bg-brand-paper p-5">
          <p className="font-display text-xl font-semibold text-brand-ink">
            {revelada.enunciado}
          </p>
          <ResultadosLive pregunta={revelada} />
        </div>
      </div>
    );
  }

  if (!abierta) return null;
  const yaVote = votada.has(abierta.id);
  const mostrarResultados = abierta.visibilidad === "EN_VIVO" || yaVote;

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="mb-1 text-center font-display text-2xl font-semibold text-brand-ink">
        {snap.nombre}
      </h1>
      <p className="mb-6 text-center text-xs font-bold uppercase tracking-[0.15em] text-brand-muted">
        Pregunta {abierta.orden + 1} de {snap.preguntas.length}
      </p>
      <div className="rounded-2xl border border-brand-border bg-brand-paper p-5">
        <h2 className="mb-5 font-display text-xl font-semibold text-brand-ink">
          {abierta.enunciado}
        </h2>
        {abierta.tipo === "OPCION_MULTIPLE" && (
          <VoterOpcionMultiple
            preguntaId={abierta.id}
            config={abierta.configuracion as never}
            opciones={abierta.opciones}
            onSubmit={async (opcionIds) => enviarVoto({ opcionIds })}
          />
        )}
        {abierta.tipo === "SI_NO" && (
          <VoterSiNo
            opciones={abierta.opciones}
            onSubmit={async (opcionIds) => enviarVoto({ opcionIds })}
          />
        )}
        {abierta.tipo === "ESCALA" && (
          <VoterEscala
            config={abierta.configuracion as never}
            onSubmit={async (valor) => enviarVoto({ valor })}
          />
        )}
        {abierta.tipo === "RANKING" && (
          <VoterRanking
            opciones={abierta.opciones}
            onSubmit={async (ordenOpciones) => enviarVoto({ ordenOpciones })}
          />
        )}
        {abierta.tipo === "NUBE_PALABRAS" && (
          <VoterNubePalabras
            config={abierta.configuracion as never}
            onSubmit={async (palabras) => enviarVoto({ palabras })}
          />
        )}
        {abierta.tipo === "RESPUESTA_ABIERTA" && (
          <VoterRespuestaAbierta
            config={abierta.configuracion as never}
            onSubmit={async (texto) => enviarVoto({ texto })}
          />
        )}
      </div>
      {mostrarResultados && <ResultadosLive pregunta={abierta} />}
    </div>
  );
}
