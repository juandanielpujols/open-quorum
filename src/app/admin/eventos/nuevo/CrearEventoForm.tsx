"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Plus, Loader2, CalendarClock, Radio, Info } from "lucide-react";

const fieldCls =
  "h-10 w-full rounded-md border border-brand-border bg-brand-paper px-3 text-sm text-brand-ink placeholder:text-brand-muted/70 shadow-none transition-[border-color,box-shadow] duration-150 ease-out focus-visible:border-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/15";

const labelCls =
  "text-[11px] font-bold uppercase tracking-[0.12em] text-brand-muted";

export type TagOption = { id: string; nombre: string; color: string | null };

export function CrearEventoForm({
  tags,
  onCrear,
}: {
  tags: TagOption[];
  onCrear: (fd: FormData) => Promise<void>;
}) {
  const [modo, setModo] = useState<"VIVO" | "ASINCRONO">("VIVO");
  const [selTags, setSelTags] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  function toggleTag(id: string) {
    setSelTags((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    for (const t of selTags) fd.append("tagIds", t);
    startTransition(async () => {
      await onCrear(fd);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* 1. Nombre */}
      <div className="space-y-1.5">
        <Label htmlFor="nombre" className={labelCls}>
          Nombre del evento
        </Label>
        <Input
          id="nombre"
          name="nombre"
          required
          placeholder="Ej: Asamblea Anual 2026"
          className={fieldCls}
        />
      </div>

      {/* 2. Descripción */}
      <div className="space-y-1.5">
        <Label htmlFor="descripcion" className={labelCls}>
          Descripción (opcional)
        </Label>
        <textarea
          id="descripcion"
          name="descripcion"
          rows={3}
          placeholder="Contexto del evento, agenda, etc."
          className={cn(fieldCls, "h-auto py-2")}
        />
      </div>

      {/* 3. Modo — arriba, para condicional de fechas */}
      <div className="space-y-2">
        <Label className={labelCls}>Modo</Label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-lg border-2 p-3 transition-all",
              modo === "VIVO"
                ? "border-brand-navy bg-brand-navy/5"
                : "border-brand-border bg-brand-paper hover:border-brand-navy/40",
            )}
          >
            <input
              type="radio"
              name="modo"
              value="VIVO"
              checked={modo === "VIVO"}
              onChange={() => setModo("VIVO")}
              className="mt-1 accent-brand-navy"
            />
            <div>
              <div className="flex items-center gap-1.5 font-medium text-brand-ink">
                <Radio aria-hidden className="size-4" />
                En vivo
              </div>
              <p className="mt-0.5 text-xs text-brand-muted">
                Asamblea presencial o remota. Admin controla cada pregunta.
              </p>
            </div>
          </label>
          <label
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-lg border-2 p-3 transition-all",
              modo === "ASINCRONO"
                ? "border-brand-navy bg-brand-navy/5"
                : "border-brand-border bg-brand-paper hover:border-brand-navy/40",
            )}
          >
            <input
              type="radio"
              name="modo"
              value="ASINCRONO"
              checked={modo === "ASINCRONO"}
              onChange={() => setModo("ASINCRONO")}
              className="mt-1 accent-brand-navy"
            />
            <div>
              <div className="flex items-center gap-1.5 font-medium text-brand-ink">
                <CalendarClock aria-hidden className="size-4" />
                Asíncrono
              </div>
              <p className="mt-0.5 text-xs text-brand-muted">
                Ventana de votación con cierre automático.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* 4. Fechas — solo asíncrono */}
      {modo === "ASINCRONO" && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="inicioAt" className={labelCls}>
              Inicio
            </Label>
            <Input
              id="inicioAt"
              type="datetime-local"
              name="inicioAt"
              required={modo === "ASINCRONO"}
              className={fieldCls}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cierreAt" className={labelCls}>
              Cierre
            </Label>
            <Input
              id="cierreAt"
              type="datetime-local"
              name="cierreAt"
              required={modo === "ASINCRONO"}
              className={fieldCls}
            />
          </div>
        </div>
      )}

      {/* 5. Poderes */}
      <div className="space-y-1.5">
        <Label htmlFor="maxPoderes" className={labelCls}>
          Poderes permitidos por representante
        </Label>
        <Input
          id="maxPoderes"
          type="number"
          name="maxPoderes"
          min={0}
          defaultValue={0}
          className={fieldCls}
        />
        <p className="inline-flex items-start gap-1.5 text-[11px] text-brand-muted">
          <Info aria-hidden className="mt-0.5 size-3 shrink-0" />
          <span>
            <strong className="text-brand-body">0</strong> deshabilita poderes para este evento.
            Deja vacío o un número mayor a 0 para permitir hasta ese máximo por proxy.
          </span>
        </p>
      </div>

      {/* 6. Resultados al cerrar */}
      <div className="space-y-2 rounded-lg border border-brand-border bg-brand-cream/40 p-3">
        <label className="flex cursor-pointer items-start gap-2">
          <input
            type="checkbox"
            name="mostrarResultadosFinales"
            defaultChecked
            className="mt-1 size-4 accent-brand-navy"
          />
          <div>
            <p className="text-sm font-medium text-brand-ink">
              Mostrar resultados a los votantes al cerrar
            </p>
            <p className="text-xs text-brand-muted">
              Si se desmarca, al finalizar los votantes solo verán la pantalla de
              agradecimiento, sin resultados.
            </p>
          </div>
        </label>
      </div>

      {/* 7. Tags */}
      <div className="space-y-2">
        <Label className={labelCls}>Etiquetas (opcional)</Label>
        {tags.length === 0 ? (
          <p className="rounded-md border border-dashed border-brand-border bg-brand-cream/50 px-3 py-3 text-xs text-brand-muted">
            No hay etiquetas creadas todavía.{" "}
            <Link
              href="/admin/tags"
              className="text-brand-navy underline-offset-2 hover:underline"
            >
              Crea una aquí
            </Link>{" "}
            para clasificar eventos (ej. Asambleas, Juntas, Elecciones).
          </p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => {
                const active = selTags.has(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTag(t.id)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-all",
                      active
                        ? "border-brand-navy bg-brand-navy/10 text-brand-ink"
                        : "border-brand-border bg-brand-paper text-brand-body hover:border-brand-navy/40",
                    )}
                  >
                    <span
                      aria-hidden
                      className="size-2.5 rounded-full"
                      style={{ background: t.color ?? "var(--brand-muted)" }}
                    />
                    {t.nombre}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-brand-muted">
              Las etiquetas agrupan eventos en listas filtrables.{" "}
              <Link
                href="/admin/tags"
                className="text-brand-navy underline-offset-2 hover:underline"
              >
                Administrar
              </Link>
            </p>
          </>
        )}
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button
          type="submit"
          disabled={isPending}
          className="bg-brand-navy text-white hover:bg-brand-navy-deep"
        >
          {isPending ? (
            <>
              <Loader2 aria-hidden className="size-4 animate-spin" />
              Creando...
            </>
          ) : (
            <>
              <Plus aria-hidden className="size-4" />
              Crear evento
            </>
          )}
        </Button>
        <Button
          asChild
          variant="outline"
          className="border-brand-border text-brand-body hover:bg-brand-cream"
        >
          <Link href="/admin/eventos">Cancelar</Link>
        </Button>
      </div>
    </form>
  );
}
