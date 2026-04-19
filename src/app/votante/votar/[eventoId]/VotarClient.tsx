"use client";
import { useEffect, useState } from "react";
import { VoterOpcionMultiple } from "@/components/preguntas/opcion-multiple/Voter";
import { VoterSiNo } from "@/components/preguntas/si-no/Voter";
import { VoterEscala } from "@/components/preguntas/escala/Voter";
import { VoterRanking } from "@/components/preguntas/ranking/Voter";
import { VoterNubePalabras } from "@/components/preguntas/nube-palabras/Voter";
import { VoterRespuestaAbierta } from "@/components/preguntas/respuesta-abierta/Voter";
import type { SnapshotEvento, SnapshotPregunta } from "@/server/snapshot";

export function VotarClient({
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
    (p) => p.estado === "ABIERTA",
  );

  async function enviarVoto(respuesta: unknown) {
    if (!actual) return;
    const r = await fetch("/api/votos", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ preguntaId: actual.id, respuesta }),
    });
    if (!r.ok) throw new Error((await r.json()).error ?? "error");
  }

  if (!actual)
    return (
      <div className="p-6 max-w-xl mx-auto text-center">
        <h1 className="text-xl font-semibold mb-2">{snap.nombre}</h1>
        <p className="text-brand-muted">Esperando próxima pregunta...</p>
      </div>
    );

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h2 className="text-xl font-semibold mb-6 text-brand-navy">{actual.enunciado}</h2>
      {actual.tipo === "OPCION_MULTIPLE" && (
        <VoterOpcionMultiple
          preguntaId={actual.id}
          config={actual.configuracion as never}
          opciones={actual.opciones}
          onSubmit={async (opcionIds) => enviarVoto({ opcionIds })}
        />
      )}
      {actual.tipo === "SI_NO" && (
        <VoterSiNo
          opciones={actual.opciones}
          onSubmit={async (opcionIds) => enviarVoto({ opcionIds })}
        />
      )}
      {actual.tipo === "ESCALA" && (
        <VoterEscala
          config={actual.configuracion as never}
          onSubmit={async (valor) => enviarVoto({ valor })}
        />
      )}
      {actual.tipo === "RANKING" && (
        <VoterRanking
          opciones={actual.opciones}
          onSubmit={async (ordenOpciones) => enviarVoto({ ordenOpciones })}
        />
      )}
      {actual.tipo === "NUBE_PALABRAS" && (
        <VoterNubePalabras
          config={actual.configuracion as never}
          onSubmit={async (palabras) => enviarVoto({ palabras })}
        />
      )}
      {actual.tipo === "RESPUESTA_ABIERTA" && (
        <VoterRespuestaAbierta
          config={actual.configuracion as never}
          onSubmit={async (texto) => enviarVoto({ texto })}
        />
      )}
    </div>
  );
}
