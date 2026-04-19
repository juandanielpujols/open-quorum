"use client";
import { useMemo, useState, useTransition } from "react";
import type { Tag } from "@/generated/prisma";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Trash2, Plus, Loader2 } from "lucide-react";

const fieldCls =
  "h-10 w-full rounded-md border border-brand-border bg-brand-paper px-3 text-sm text-brand-ink placeholder:text-brand-muted/70 shadow-none focus-visible:border-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/15";

const labelCls = "text-[11px] font-bold uppercase tracking-[0.12em] text-brand-muted";

// Paleta sugerida — colores distintos entre sí para badges legibles
const PALETTE = [
  "#1E3A5F", // navy
  "#C62828", // crimson
  "#047857", // emerald
  "#A16207", // amber
  "#0E7490", // teal
  "#7C2D12", // terracota
  "#6D28D9", // púrpura
  "#BE185D", // magenta
  "#4B5563", // grafito
  "#92400E", // ocre
];

function primerColorNoUsado(usados: Set<string>): string {
  const libre = PALETTE.find((c) => !usados.has(c.toLowerCase()));
  return libre ?? PALETTE[0];
}

export function TagsManager({
  tags,
  onCrear,
  onEliminar,
  onActualizarColor,
  onActualizarNombre,
}: {
  tags: Tag[];
  onCrear: (fd: FormData) => Promise<void>;
  onEliminar: (fd: FormData) => Promise<void>;
  onActualizarColor: (fd: FormData) => Promise<void>;
  onActualizarNombre: (fd: FormData) => Promise<void>;
}) {
  const usados = useMemo(
    () => new Set(tags.map((t) => (t.color ?? "").toLowerCase())),
    [tags],
  );
  const defaultColor = useMemo(() => primerColorNoUsado(usados), [usados]);

  const [nombre, setNombre] = useState("");
  const [color, setColor] = useState(defaultColor);
  const [isCreating, startCreate] = useTransition();

  // Re-sync default color when a tag is created/deleted and default is now used
  useMemo(() => {
    if (usados.has(color.toLowerCase())) setColor(primerColorNoUsado(usados));
  }, [usados]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startCreate(async () => {
      await onCrear(fd);
      setNombre("");
      setColor(primerColorNoUsado(usados));
    });
  }

  return (
    <div className="space-y-6">
      {/* Crear */}
      <Card className="border-brand-border bg-brand-paper shadow-none">
        <CardHeader className="pb-4">
          <CardTitle className="font-display text-lg font-semibold text-brand-ink">
            Nuevo tag
          </CardTitle>
          <CardDescription className="text-xs text-brand-muted">
            {tags.length > 0
              ? "Los colores ya en uso aparecen marcados abajo; el selector sugiere uno libre."
              : "Elige un color para distinguir este tag en la lista de eventos."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto]">
              <div className="space-y-1.5">
                <Label htmlFor="nombre" className={labelCls}>
                  Nombre
                </Label>
                <Input
                  id="nombre"
                  name="nombre"
                  required
                  placeholder="Ej: Elecciones 2026"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className={fieldCls}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="color" className={labelCls}>
                  Color
                </Label>
                <div className="flex h-10 items-center gap-2 rounded-md border border-brand-border bg-brand-paper px-2">
                  <input
                    id="color"
                    name="color"
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="size-7 cursor-pointer rounded border border-brand-border bg-transparent"
                  />
                  <span className="font-mono text-xs uppercase tracking-wider text-brand-muted">
                    {color}
                  </span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className={cn(labelCls, "invisible sm:visible")}>
                  &nbsp;
                </Label>
                <Button
                  type="submit"
                  disabled={isCreating || !nombre.trim()}
                  className="bg-brand-navy text-white hover:bg-brand-navy-deep"
                >
                  {isCreating ? (
                    <Loader2 aria-hidden className="size-4 animate-spin" />
                  ) : (
                    <Plus aria-hidden className="size-4" />
                  )}
                  Crear
                </Button>
              </div>
            </div>

            {/* Paleta sugerida */}
            <div>
              <p className={cn(labelCls, "mb-2")}>Paleta sugerida</p>
              <div className="flex flex-wrap gap-2">
                {PALETTE.map((c) => {
                  const enUso = usados.has(c.toLowerCase());
                  const activo = color.toLowerCase() === c.toLowerCase();
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      aria-label={`Usar color ${c}`}
                      title={enUso ? `${c} · ya en uso` : c}
                      className={cn(
                        "relative size-8 rounded-full border-2 transition-all duration-150",
                        activo
                          ? "border-brand-ink ring-2 ring-brand-ink/20"
                          : "border-white hover:scale-110",
                        enUso && "opacity-50",
                      )}
                      style={{ background: c }}
                    >
                      {enUso && (
                        <span className="absolute -right-0.5 -top-0.5 inline-flex size-3.5 items-center justify-center rounded-full bg-brand-paper text-[9px] font-bold text-brand-crimson ring-1 ring-brand-crimson">
                          ·
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Lista */}
      <section>
        <h2 className="mb-3 font-display text-lg font-semibold text-brand-ink">
          Tags existentes
          <span className="ml-2 text-sm font-normal text-brand-muted">
            ({tags.length})
          </span>
        </h2>
        {tags.length === 0 ? (
          <div className="rounded-xl border border-dashed border-brand-border bg-brand-paper/60 px-6 py-10 text-center text-sm text-brand-muted">
            Aún no hay tags. Crea el primero arriba.
          </div>
        ) : (
          <ul className="space-y-2">
            {tags.map((t) => (
              <TagRow
                key={t.id}
                tag={t}
                onActualizarColor={onActualizarColor}
                onActualizarNombre={onActualizarNombre}
                onEliminar={onEliminar}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function TagRow({
  tag,
  onActualizarColor,
  onActualizarNombre,
  onEliminar,
}: {
  tag: Tag;
  onActualizarColor: (fd: FormData) => Promise<void>;
  onActualizarNombre: (fd: FormData) => Promise<void>;
  onEliminar: (fd: FormData) => Promise<void>;
}) {
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState(tag.nombre);
  const [savingColor, startSaveColor] = useTransition();
  const [savingNombre, startSaveNombre] = useTransition();
  const [deleting, startDelete] = useTransition();

  function cambiarColor(e: React.ChangeEvent<HTMLInputElement>) {
    const nuevo = e.target.value;
    const fd = new FormData();
    fd.set("id", tag.id);
    fd.set("color", nuevo);
    startSaveColor(async () => {
      await onActualizarColor(fd);
    });
  }

  function guardarNombre(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startSaveNombre(async () => {
      await onActualizarNombre(fd);
      setEditando(false);
    });
  }

  function eliminar() {
    const fd = new FormData();
    fd.set("id", tag.id);
    startDelete(async () => {
      await onEliminar(fd);
    });
  }

  return (
    <li className="flex items-center gap-3 rounded-lg border border-brand-border bg-brand-paper px-3 py-2.5 transition-colors hover:border-brand-navy/30">
      <label className="relative flex shrink-0 cursor-pointer items-center">
        <input
          type="color"
          defaultValue={tag.color ?? "#64748B"}
          onChange={cambiarColor}
          disabled={savingColor}
          aria-label={`Cambiar color de ${tag.nombre}`}
          className="absolute inset-0 size-6 cursor-pointer opacity-0"
        />
        <span
          aria-hidden
          className={cn(
            "size-6 rounded-full border-2 border-white shadow-sm ring-1 ring-brand-border transition-all",
            savingColor && "opacity-50",
          )}
          style={{ background: tag.color ?? "#64748B" }}
        />
      </label>

      {editando ? (
        <form onSubmit={guardarNombre} className="flex flex-1 items-center gap-2">
          <input type="hidden" name="id" value={tag.id} />
          <Input
            name="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            autoFocus
            className={cn(fieldCls, "h-8")}
          />
          <Button
            type="submit"
            size="sm"
            disabled={savingNombre || !nombre.trim()}
            className="bg-brand-navy text-white hover:bg-brand-navy-deep"
          >
            {savingNombre ? <Loader2 className="size-3.5 animate-spin" /> : "Guardar"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setEditando(false);
              setNombre(tag.nombre);
            }}
          >
            Cancelar
          </Button>
        </form>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setEditando(true)}
            className="flex-1 truncate text-left text-sm font-medium text-brand-ink hover:text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/30 rounded"
          >
            {tag.nombre}
          </button>
          <span className="font-mono text-[11px] uppercase tracking-wider text-brand-muted">
            {(tag.color ?? "").toLowerCase()}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={deleting}
            onClick={eliminar}
            aria-label={`Eliminar ${tag.nombre}`}
            className="size-8 text-brand-muted hover:bg-brand-crimson/10 hover:text-brand-crimson"
          >
            {deleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
          </Button>
        </>
      )}
    </li>
  );
}
