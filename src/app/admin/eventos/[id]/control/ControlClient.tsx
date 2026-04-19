"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { SnapshotEvento } from "@/server/snapshot";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Eye,
  EyeOff,
  MonitorPlay,
  Play,
  Square,
  CheckCheck,
  Users,
} from "lucide-react";

const TIPO_LABEL: Record<string, string> = {
  OPCION_MULTIPLE: "Opción múltiple",
  SI_NO: "Sí / No",
  ESCALA: "Escala 1–5",
};

const ESTADO_STYLE: Record<string, string> = {
  BORRADOR: "bg-brand-cream-deep text-brand-body",
  ABIERTA: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200",
  CERRADA: "bg-brand-muted/10 text-brand-muted",
  REVELADA: "bg-brand-navy/10 text-brand-navy",
};

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

  const totalInvitados = snap.totalInvitados ?? 0;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 lg:px-8 lg:py-10">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <nav className="mb-2 text-xs text-brand-muted">
            <Link href="/admin/eventos" className="hover:text-brand-ink hover:underline">
              Eventos
            </Link>
            <span className="mx-2 text-brand-muted/50">/</span>
            <Link
              href={`/admin/eventos/${eventoId}`}
              className="hover:text-brand-ink hover:underline"
            >
              {snap.nombre}
            </Link>
            <span className="mx-2 text-brand-muted/50">/</span>
            <span>Control</span>
          </nav>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-brand-ink">
            {snap.nombre}
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-brand-muted">
            <Users aria-hidden className="size-3.5" />
            {totalInvitados} invitado{totalInvitados === 1 ? "" : "s"} en este evento
          </p>
        </div>
        <Button
          asChild
          className="bg-brand-navy text-white hover:bg-brand-navy-deep"
        >
          <Link href={`/proyectar/${eventoId}`} target="_blank" rel="noopener">
            <MonitorPlay aria-hidden className="size-4" />
            Abrir proyector
          </Link>
        </Button>
      </header>

      <ul className="space-y-3">
        {snap.preguntas.map((p) => {
          const votos = p.totalVotos ?? 0;
          const pctParticipacion =
            totalInvitados > 0 ? Math.min(100, Math.round((votos / totalInvitados) * 100)) : 0;
          const estadoClass = ESTADO_STYLE[p.estado] ?? ESTADO_STYLE.BORRADOR;
          return (
            <li key={p.id}>
              <Card className="border-brand-border bg-brand-paper shadow-none">
                <CardContent className="p-5">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 shrink-0 rounded bg-brand-cream-deep px-1.5 py-0.5 font-mono text-[11px] font-semibold tabular-nums text-brand-body">
                          {String(p.orden + 1).padStart(2, "0")}
                        </span>
                        <p className="font-medium text-brand-ink">{p.enunciado}</p>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className="inline-flex items-center rounded bg-brand-cream-deep px-1.5 py-0.5 font-medium text-brand-body">
                          {TIPO_LABEL[p.tipo] ?? p.tipo}
                        </span>
                        <span className="inline-flex items-center gap-1 text-brand-muted">
                          {p.visibilidad === "EN_VIVO" ? (
                            <>
                              <Eye aria-hidden className="size-3" />
                              En vivo
                            </>
                          ) : (
                            <>
                              <EyeOff aria-hidden className="size-3" />
                              Oculto
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${estadoClass}`}
                    >
                      {p.estado}
                    </span>
                  </div>

                  {/* Contador de participación — siempre visible */}
                  <div className="mb-3 rounded-lg border border-brand-border bg-brand-cream/60 px-3 py-2.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand-muted">
                        Participación
                      </span>
                      <span className="font-mono text-sm tabular-nums text-brand-ink">
                        <span className="font-semibold">{votos}</span>
                        <span className="text-brand-muted"> / {totalInvitados}</span>
                        {totalInvitados > 0 && (
                          <span className="ml-2 text-brand-muted">({pctParticipacion}%)</span>
                        )}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-brand-cream-deep">
                      <div
                        className={`h-full transition-[width] duration-500 ease-out ${
                          p.estado === "ABIERTA" ? "bg-emerald-500" : "bg-brand-navy"
                        }`}
                        style={{ width: `${pctParticipacion}%` }}
                        aria-hidden
                      />
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex flex-wrap gap-2">
                    {p.estado === "BORRADOR" && (
                      <Button
                        size="sm"
                        onClick={() => accion(p.id, "abrir")}
                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                      >
                        <Play aria-hidden className="size-3.5" />
                        Abrir
                      </Button>
                    )}
                    {p.estado === "ABIERTA" && (
                      <Button
                        size="sm"
                        onClick={() => accion(p.id, "cerrar")}
                        className="bg-brand-crimson text-white hover:bg-brand-crimson-deep"
                      >
                        <Square aria-hidden className="size-3.5" />
                        Cerrar
                      </Button>
                    )}
                    {p.estado === "CERRADA" && p.visibilidad === "OCULTO_HASTA_CERRAR" && (
                      <Button
                        size="sm"
                        onClick={() => accion(p.id, "revelar")}
                        className="bg-brand-navy text-white hover:bg-brand-navy-deep"
                      >
                        <CheckCheck aria-hidden className="size-3.5" />
                        Revelar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
