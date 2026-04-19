"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { SnapshotEvento } from "@/server/snapshot";

export function ControlClient({
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

  async function accion(preguntaId: string, tipo: "abrir" | "cerrar" | "revelar") {
    await fetch(`/api/admin/preguntas/${preguntaId}/${tipo}`, { method: "POST" });
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">{snap.nombre} — Control</h1>
        <Link
          href={`/proyectar/${eventoId}`}
          target="_blank"
          className="bg-sb-azul text-white px-4 py-2 rounded-lg"
        >
          Abrir proyector ↗
        </Link>
      </div>
      <ul className="space-y-3">
        {snap.preguntas.map((p) => (
          <li key={p.id} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-medium">
                  {p.orden + 1}. {p.enunciado}
                </p>
                <p className="text-xs text-sb-gris">
                  {p.tipo} · {p.visibilidad} · {p.totalVotos} votos
                </p>
              </div>
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full ${
                  p.estado === "ABIERTA"
                    ? "bg-sb-verde/20 text-sb-verde"
                    : p.estado === "CERRADA"
                      ? "bg-sb-gris/20 text-sb-gris"
                      : p.estado === "REVELADA"
                        ? "bg-sb-azul/20 text-sb-azul"
                        : "bg-gray-100 text-gray-500"
                }`}
              >
                {p.estado}
              </span>
            </div>
            <div className="flex gap-2">
              {p.estado === "BORRADOR" && (
                <button
                  onClick={() => accion(p.id, "abrir")}
                  className="bg-sb-verde text-white px-3 py-1 rounded-lg text-sm"
                >
                  Abrir
                </button>
              )}
              {p.estado === "ABIERTA" && (
                <button
                  onClick={() => accion(p.id, "cerrar")}
                  className="bg-sb-terracota text-white px-3 py-1 rounded-lg text-sm"
                >
                  Cerrar
                </button>
              )}
              {p.estado === "CERRADA" && p.visibilidad === "OCULTO_HASTA_CERRAR" && (
                <button
                  onClick={() => accion(p.id, "revelar")}
                  className="bg-sb-azul text-white px-3 py-1 rounded-lg text-sm"
                >
                  Revelar
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
