import Link from "next/link";
import { listarEventos } from "@/server/eventos";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarPlus, CalendarX, Inbox, Users } from "lucide-react";

export const dynamic = "force-dynamic";

const ESTADO_STYLE: Record<string, string> = {
  BORRADOR: "bg-brand-cream-deep text-brand-body border-brand-border",
  ACTIVO: "bg-emerald-50 text-emerald-800 border-emerald-200/70",
  FINALIZADO: "bg-brand-navy/10 text-brand-navy border-brand-navy/20",
};

const MODO_LABEL: Record<string, string> = {
  VIVO: "En vivo",
  ASINCRONO: "Asíncrono",
};

export default async function EventosPage() {
  const eventos = await listarEventos();
  const enBorrador = eventos.filter((e) => e.estado === "BORRADOR").length;
  const activos = eventos.filter((e) => e.estado === "ACTIVO").length;
  const finalizados = eventos.filter((e) => e.estado === "FINALIZADO").length;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 lg:px-8 lg:py-10">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-brand-ink">
            Eventos
          </h1>
          <p className="mt-1 text-sm text-brand-muted">
            Crea, edita y ejecuta asambleas y votaciones.
          </p>
        </div>
        <Button
          asChild
          className="bg-brand-navy text-white shadow-none hover:bg-brand-navy-deep"
        >
          <Link href="/admin/eventos/nuevo">
            <CalendarPlus aria-hidden className="size-4" />
            Nuevo evento
          </Link>
        </Button>
      </header>

      {eventos.length > 0 && (
        <div className="mb-6 grid grid-cols-3 gap-3 sm:max-w-md">
          <StatCard label="En borrador" value={enBorrador} />
          <StatCard label="Activos" value={activos} accent />
          <StatCard label="Finalizados" value={finalizados} />
        </div>
      )}

      {eventos.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="space-y-2">
          {eventos.map((e) => {
            const estadoClass = ESTADO_STYLE[e.estado] ?? ESTADO_STYLE.BORRADOR;
            return (
              <li key={e.id}>
                <Link
                  href={`/admin/eventos/${e.id}`}
                  className="group block rounded-xl border border-brand-border bg-brand-paper px-5 py-4 transition-all duration-150 ease-out hover:border-brand-navy/30 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/30"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h2 className="font-display text-lg font-semibold text-brand-ink group-hover:text-brand-navy">
                          {e.nombre}
                        </h2>
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${estadoClass}`}
                        >
                          {e.estado}
                        </span>
                      </div>
                      {e.descripcion && (
                        <p className="mt-1 line-clamp-1 text-sm text-brand-muted">
                          {e.descripcion}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-brand-muted">
                      <span className="inline-flex items-center gap-1">
                        <CalendarX aria-hidden className="size-3.5" />
                        {MODO_LABEL[e.modo] ?? e.modo}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Inbox aria-hidden className="size-3.5" />
                        {e._count.preguntas} pregunta{e._count.preguntas === 1 ? "" : "s"}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Users aria-hidden className="size-3.5" />
                        {e._count.invitados}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <Card className="border-brand-border bg-brand-paper shadow-none">
      <CardContent className="px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-muted">
          {label}
        </p>
        <p
          className={`mt-1 font-display text-3xl font-semibold leading-none tabular-nums ${
            accent ? "text-brand-crimson" : "text-brand-ink"
          }`}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-brand-border bg-brand-paper/60 px-6 py-16 text-center">
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-brand-cream-deep">
        <CalendarPlus aria-hidden className="size-6 text-brand-navy" />
      </div>
      <h2 className="font-display text-xl font-semibold text-brand-ink">
        Aún no hay eventos
      </h2>
      <p className="mx-auto mt-1 max-w-xs text-sm text-brand-muted">
        Crea tu primer evento para comenzar a registrar votaciones.
      </p>
      <Button
        asChild
        className="mt-5 bg-brand-navy text-white hover:bg-brand-navy-deep"
      >
        <Link href="/admin/eventos/nuevo">
          <CalendarPlus aria-hidden className="size-4" />
          Nuevo evento
        </Link>
      </Button>
    </div>
  );
}
