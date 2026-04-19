"use client";
import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SnapshotEvento, SnapshotPregunta } from "@/server/snapshot";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  CheckCheck,
  CheckSquare,
  Eye,
  EyeOff,
  FastForward,
  Loader2,
  MonitorPlay,
  Play,
  Square,
  Users,
} from "lucide-react";

const TIPO_LABEL: Record<string, string> = {
  OPCION_MULTIPLE: "Opción múltiple",
  SI_NO: "Sí / No",
  ESCALA: "Escala",
  RANKING: "Ranking",
  NUBE_PALABRAS: "Nube de palabras",
  RESPUESTA_ABIERTA: "Respuesta abierta",
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
  const router = useRouter();
  const [snap, setSnap] = useState<SnapshotEvento>(initial);
  const [pendingAccion, setPendingAccion] = useState<string | null>(null);
  const [confirmAbrir, setConfirmAbrir] = useState<SnapshotPregunta | null>(null);
  const [confirmFinalizar, setConfirmFinalizar] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const es = new EventSource(`/api/eventos/${eventoId}/stream`);
    es.onmessage = async () => {
      const r = await fetch(`/api/eventos/${eventoId}/snapshot`);
      if (r.ok) setSnap(await r.json());
    };
    return () => es.close();
  }, [eventoId]);

  async function accion(preguntaId: string, tipo: "abrir" | "cerrar" | "revelar") {
    setPendingAccion(`${tipo}:${preguntaId}`);
    try {
      await fetch(`/api/admin/preguntas/${preguntaId}/${tipo}`, { method: "POST" });
    } finally {
      setPendingAccion(null);
    }
  }

  async function cerrarYAbrir(cerrarId: string, abrirId: string) {
    setPendingAccion(`avanzar:${abrirId}`);
    try {
      await fetch(`/api/admin/preguntas/${cerrarId}/cerrar`, { method: "POST" });
      await fetch(`/api/admin/preguntas/${abrirId}/abrir`, { method: "POST" });
    } finally {
      setPendingAccion(null);
    }
  }

  async function finalizarEvento() {
    setPendingAccion("finalizar");
    try {
      await fetch(`/api/admin/eventos/${eventoId}/finalizar`, { method: "POST" });
      setConfirmFinalizar(false);
      startTransition(() => router.refresh());
    } finally {
      setPendingAccion(null);
    }
  }

  const totalInvitados = snap.totalInvitados ?? 0;

  const abierta = useMemo(
    () => snap.preguntas.find((p) => p.estado === "ABIERTA"),
    [snap.preguntas],
  );

  const proxima = useMemo(
    () =>
      abierta
        ? snap.preguntas.find((p) => p.estado === "BORRADOR" && p.orden > abierta.orden)
        : snap.preguntas.find((p) => p.estado === "BORRADOR"),
    [snap.preguntas, abierta],
  );

  const preguntasCerrables = snap.preguntas.some((p) => p.estado === "BORRADOR");
  const puedeFinalizar = snap.estado !== "FINALIZADO" && !preguntasCerrables;

  function clickAbrir(p: SnapshotPregunta) {
    if (abierta && abierta.id !== p.id) {
      setConfirmAbrir(p);
      return;
    }
    accion(p.id, "abrir");
  }

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
        <Button asChild className="bg-brand-navy text-white hover:bg-brand-navy-deep">
          <Link href={`/proyectar/${eventoId}`} target="_blank" rel="noopener">
            <MonitorPlay aria-hidden className="size-4" />
            Abrir proyector
          </Link>
        </Button>
      </header>

      {/* Barra de acciones rápidas */}
      {(abierta || proxima || puedeFinalizar) && (
        <div className="sticky top-0 z-10 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-border bg-brand-paper/95 px-4 py-3 shadow-sm backdrop-blur">
          <div className="min-w-0 text-xs text-brand-muted">
            {abierta ? (
              <span>
                Pregunta activa:{" "}
                <span className="font-medium text-brand-ink">
                  {abierta.enunciado}
                </span>
              </span>
            ) : proxima ? (
              <span>Lista para abrir la próxima pregunta.</span>
            ) : puedeFinalizar ? (
              <span>Todas las preguntas gestionadas. Listo para finalizar.</span>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {abierta && proxima && (
              <Button
                size="sm"
                disabled={pendingAccion === `avanzar:${proxima.id}`}
                onClick={() => cerrarYAbrir(abierta.id, proxima.id)}
                className="bg-brand-navy text-white hover:bg-brand-navy-deep"
              >
                {pendingAccion === `avanzar:${proxima.id}` ? (
                  <Loader2 aria-hidden className="size-3.5 animate-spin" />
                ) : (
                  <FastForward aria-hidden className="size-3.5" />
                )}
                Avanzar a próxima pregunta
              </Button>
            )}
            {!abierta && proxima && (
              <Button
                size="sm"
                disabled={pendingAccion === `abrir:${proxima.id}`}
                onClick={() => accion(proxima.id, "abrir")}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
              >
                {pendingAccion === `abrir:${proxima.id}` ? (
                  <Loader2 aria-hidden className="size-3.5 animate-spin" />
                ) : (
                  <Play aria-hidden className="size-3.5" />
                )}
                Abrir próxima
              </Button>
            )}
            {puedeFinalizar && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setConfirmFinalizar(true)}
                className="border-brand-crimson/40 text-brand-crimson hover:bg-brand-crimson/10 hover:text-brand-crimson-deep"
              >
                <CheckSquare aria-hidden className="size-3.5" />
                Finalizar ejercicio
              </Button>
            )}
          </div>
        </div>
      )}

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
                        onClick={() => clickAbrir(p)}
                        disabled={pendingAccion !== null}
                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                      >
                        {pendingAccion === `abrir:${p.id}` ? (
                          <Loader2 aria-hidden className="size-3.5 animate-spin" />
                        ) : (
                          <Play aria-hidden className="size-3.5" />
                        )}
                        Abrir
                      </Button>
                    )}
                    {p.estado === "ABIERTA" && (
                      <Button
                        size="sm"
                        onClick={() => accion(p.id, "cerrar")}
                        disabled={pendingAccion !== null}
                        className="bg-brand-crimson text-white hover:bg-brand-crimson-deep"
                      >
                        {pendingAccion === `cerrar:${p.id}` ? (
                          <Loader2 aria-hidden className="size-3.5 animate-spin" />
                        ) : (
                          <Square aria-hidden className="size-3.5" />
                        )}
                        Cerrar
                      </Button>
                    )}
                    {p.estado === "CERRADA" && p.visibilidad === "OCULTO_HASTA_CERRAR" && (
                      <Button
                        size="sm"
                        onClick={() => accion(p.id, "revelar")}
                        disabled={pendingAccion !== null}
                        className="bg-brand-navy text-white hover:bg-brand-navy-deep"
                      >
                        {pendingAccion === `revelar:${p.id}` ? (
                          <Loader2 aria-hidden className="size-3.5 animate-spin" />
                        ) : (
                          <CheckCheck aria-hidden className="size-3.5" />
                        )}
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

      {/* Diálogo: confirmación de abrir cuando hay otra abierta */}
      <AlertDialog
        open={confirmAbrir !== null}
        onOpenChange={(open) => !open && setConfirmAbrir(null)}
      >
        <AlertDialogContent className="border-brand-border bg-brand-paper">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-xl text-brand-ink">
              ¿Cerrar la pregunta actual?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-brand-body">
              Hay otra pregunta abierta. Solo puede haber una pregunta activa a la vez.
              Se cerrará la actual y se abrirá la nueva.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-brand-border text-brand-body hover:bg-brand-cream">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async (e) => {
                e.preventDefault();
                if (!abierta || !confirmAbrir) return;
                await cerrarYAbrir(abierta.id, confirmAbrir.id);
                setConfirmAbrir(null);
              }}
              className="bg-brand-navy text-white hover:bg-brand-navy-deep"
            >
              Sí, avanzar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo: finalizar ejercicio */}
      <AlertDialog open={confirmFinalizar} onOpenChange={setConfirmFinalizar}>
        <AlertDialogContent className="border-brand-border bg-brand-paper">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-xl text-brand-ink">
              ¿Finalizar el ejercicio?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-brand-body">
              El proyector y los votantes verán una pantalla de agradecimiento.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={pendingAccion === "finalizar"}
              className="border-brand-border text-brand-body hover:bg-brand-cream"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={pendingAccion === "finalizar"}
              onClick={(e) => {
                e.preventDefault();
                finalizarEvento();
              }}
              className="bg-brand-crimson text-white hover:bg-brand-crimson-deep"
            >
              {pendingAccion === "finalizar" ? (
                <>
                  <Loader2 aria-hidden className="size-4 animate-spin" />
                  Finalizando...
                </>
              ) : (
                <>Sí, finalizar</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
