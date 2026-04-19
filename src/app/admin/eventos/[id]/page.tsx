import Link from "next/link";
import {
  obtenerEvento,
  activarEvento,
  invitarUsuarios,
  removerInvitacion,
} from "@/server/eventos";
import { crearPregunta, eliminarPregunta, actualizarPregunta } from "@/server/preguntas";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Lock,
  Play,
  Plus,
  Trash2,
  UserMinus,
  UserPlus,
  Pencil,
  CheckCheck,
} from "lucide-react";

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

const TIPO_LABEL: Record<string, string> = {
  OPCION_MULTIPLE: "Opción múltiple",
  SI_NO: "Sí / No",
  ESCALA: "Escala 1–5",
};

const VISIBILIDAD_LABEL: Record<string, string> = {
  EN_VIVO: "En vivo",
  OCULTO_HASTA_CERRAR: "Oculto hasta cerrar",
};

const ESTADO_PREG_STYLE: Record<string, string> = {
  BORRADOR: "bg-brand-cream-deep text-brand-body",
  ABIERTA: "bg-emerald-50 text-emerald-800",
  CERRADA: "bg-brand-muted/10 text-brand-muted",
  REVELADA: "bg-brand-navy/10 text-brand-navy",
};

const fieldCls =
  "h-10 w-full rounded-md border border-brand-border bg-brand-paper px-3 text-sm text-brand-ink placeholder:text-brand-muted/70 shadow-none transition-[border-color,box-shadow] duration-150 ease-out focus-visible:border-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/15";

const labelCls =
  "text-[11px] font-bold uppercase tracking-[0.12em] text-brand-muted";

export default async function EventoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const e = await obtenerEvento(id);
  if (!e) return notFound();

  const invitadosIds = new Set(e.invitados.map((i) => i.userId));
  const usuariosDisponibles = await prisma.user.findMany({
    where: {
      rol: "VOTANTE",
      activado: true,
      id: { notIn: Array.from(invitadosIds) },
    },
    orderBy: { nombre: "asc" },
  });

  async function onActivar() {
    "use server";
    await activarEvento(id);
    revalidatePath(`/admin/eventos/${id}`);
  }

  async function onInvitar(fd: FormData) {
    "use server";
    const ids = fd.getAll("userId").map(String).filter(Boolean);
    if (ids.length === 0) return;
    await invitarUsuarios(id, ids);
    revalidatePath(`/admin/eventos/${id}`);
  }

  async function onDesinvitar(fd: FormData) {
    "use server";
    await removerInvitacion(id, String(fd.get("userId")));
    revalidatePath(`/admin/eventos/${id}`);
  }

  async function onCrearPregunta(fd: FormData) {
    "use server";
    const tipo = String(fd.get("tipo")) as "OPCION_MULTIPLE" | "SI_NO" | "ESCALA";
    const configRaw: Record<string, unknown> = {};
    if (tipo === "ESCALA") {
      configRaw.min = Number(fd.get("escalaMin") ?? 1);
      configRaw.max = Number(fd.get("escalaMax") ?? 5);
      configRaw.etiquetaMin = String(fd.get("escalaEtiMin") ?? "");
      configRaw.etiquetaMax = String(fd.get("escalaEtiMax") ?? "");
    } else if (tipo === "OPCION_MULTIPLE") {
      configRaw.permitirMultiple = fd.get("permitirMultiple") === "on";
      configRaw.maxSelecciones = Number(fd.get("maxSelecciones") ?? 1);
    }
    const opcionesRaw = String(fd.get("opciones") ?? "").split("\n").filter(Boolean);
    await crearPregunta({
      eventoId: id,
      tipo,
      enunciado: String(fd.get("enunciado")),
      visibilidad: String(fd.get("visibilidad")) as "EN_VIVO" | "OCULTO_HASTA_CERRAR",
      configuracion: configRaw,
      opciones: opcionesRaw.map((t) => ({ texto: t })),
    });
    revalidatePath(`/admin/eventos/${id}`);
  }

  async function onEliminarPregunta(fd: FormData) {
    "use server";
    await eliminarPregunta(String(fd.get("pid")));
    revalidatePath(`/admin/eventos/${id}`);
  }

  async function onActualizarPregunta(fd: FormData) {
    "use server";
    const pid = String(fd.get("pid"));
    const tipo = String(fd.get("tipo")) as "OPCION_MULTIPLE" | "SI_NO" | "ESCALA";
    const configRaw: Record<string, unknown> = {};
    if (tipo === "ESCALA") {
      configRaw.min = Number(fd.get("escalaMin") ?? 1);
      configRaw.max = Number(fd.get("escalaMax") ?? 5);
      configRaw.etiquetaMin = String(fd.get("escalaEtiMin") ?? "");
      configRaw.etiquetaMax = String(fd.get("escalaEtiMax") ?? "");
    } else if (tipo === "OPCION_MULTIPLE") {
      configRaw.permitirMultiple = fd.get("permitirMultiple") === "on";
      configRaw.maxSelecciones = Number(fd.get("maxSelecciones") ?? 1);
    }
    const opcionesRaw = String(fd.get("opciones") ?? "")
      .split("\n")
      .filter(Boolean);
    await actualizarPregunta(pid, {
      enunciado: String(fd.get("enunciado")),
      descripcion: String(fd.get("descripcion") ?? "") || undefined,
      visibilidad: String(fd.get("visibilidad")) as "EN_VIVO" | "OCULTO_HASTA_CERRAR",
      configuracion: configRaw,
      opciones: opcionesRaw.map((t) => ({ texto: t })),
    });
    revalidatePath(`/admin/eventos/${id}`);
  }

  const estadoClass = ESTADO_STYLE[e.estado] ?? ESTADO_STYLE.BORRADOR;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 lg:px-8 lg:py-10">
      {/* Encabezado */}
      <header className="mb-8">
        <nav className="mb-3 text-xs text-brand-muted">
          <Link href="/admin/eventos" className="hover:text-brand-ink hover:underline">
            Eventos
          </Link>
          <span className="mx-2 text-brand-muted/50">/</span>
          <span>{e.nombre}</span>
        </nav>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-3xl font-semibold tracking-tight text-brand-ink">
                {e.nombre}
              </h1>
              <span
                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${estadoClass}`}
              >
                {e.estado}
              </span>
            </div>
            <p className="mt-1.5 text-sm text-brand-muted">
              {MODO_LABEL[e.modo] ?? e.modo} · {e.preguntas.length} pregunta
              {e.preguntas.length === 1 ? "" : "s"} · {e.invitados.length} invitado
              {e.invitados.length === 1 ? "" : "s"}
            </p>
            {e.descripcion && (
              <p className="mt-2 max-w-prose text-sm text-brand-body">{e.descripcion}</p>
            )}
          </div>
          <div className="flex shrink-0 gap-2">
            {e.estado === "BORRADOR" && (
              <form action={onActivar}>
                <Button
                  type="submit"
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  <Play aria-hidden className="size-4" />
                  Activar evento
                </Button>
              </form>
            )}
            {e.estado === "ACTIVO" && (
              <Button asChild className="bg-brand-navy text-white hover:bg-brand-navy-deep">
                <Link href={`/admin/eventos/${e.id}/control`}>
                  Control en vivo
                  <ArrowRight aria-hidden className="size-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Columna principal: nueva pregunta + preguntas */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="border-brand-border bg-brand-paper shadow-none">
            <CardHeader className="pb-4">
              <CardTitle className="font-display text-lg font-semibold text-brand-ink">
                Nueva pregunta
              </CardTitle>
              <CardDescription className="text-xs text-brand-muted">
                Agrega preguntas al evento. Podrás editarlas mientras estén en borrador.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={onCrearPregunta} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="enunciado" className={labelCls}>
                    Enunciado
                  </Label>
                  <Input
                    id="enunciado"
                    name="enunciado"
                    placeholder="Ej: ¿Aprobamos el presupuesto 2026?"
                    required
                    className={fieldCls}
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="tipo" className={labelCls}>
                      Tipo
                    </Label>
                    <select name="tipo" id="tipo" className={fieldCls}>
                      <option value="OPCION_MULTIPLE">Opción múltiple</option>
                      <option value="SI_NO">Sí / No</option>
                      <option value="ESCALA">Escala 1-5</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="visibilidad" className={labelCls}>
                      Visibilidad de resultados
                    </Label>
                    <select name="visibilidad" id="visibilidad" className={fieldCls}>
                      <option value="OCULTO_HASTA_CERRAR">Oculto hasta cerrar</option>
                      <option value="EN_VIVO">En vivo</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="opciones" className={labelCls}>
                    Opciones (una por línea)
                  </Label>
                  <textarea
                    id="opciones"
                    name="opciones"
                    placeholder="Opción A&#10;Opción B&#10;Opción C"
                    rows={4}
                    className={cn(fieldCls, "h-auto py-2 font-mono text-xs")}
                  />
                  <p className="text-[11px] text-brand-muted">
                    Para Sí/No y Escala, las opciones se generan automáticamente.
                  </p>
                </div>
                <details className="rounded-md border border-brand-border bg-brand-cream/40">
                  <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-brand-body hover:text-brand-ink">
                    Opciones avanzadas por tipo
                  </summary>
                  <div className="grid grid-cols-1 gap-2 border-t border-brand-border p-3 sm:grid-cols-2">
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        name="permitirMultiple"
                        className="size-3.5 accent-brand-navy"
                      />
                      Permitir múltiples (MC)
                    </label>
                    <Input
                      name="maxSelecciones"
                      type="number"
                      min={1}
                      defaultValue={1}
                      placeholder="Máx. selecciones"
                      className={fieldCls}
                    />
                    <Input name="escalaMin" type="number" defaultValue={1} placeholder="Escala min" className={fieldCls} />
                    <Input name="escalaMax" type="number" defaultValue={5} placeholder="Escala max" className={fieldCls} />
                    <Input name="escalaEtiMin" placeholder="Etiqueta min (Escala)" className={fieldCls} />
                    <Input name="escalaEtiMax" placeholder="Etiqueta max (Escala)" className={fieldCls} />
                  </div>
                </details>
                <Button
                  type="submit"
                  className="bg-brand-navy text-white hover:bg-brand-navy-deep"
                >
                  <Plus aria-hidden className="size-4" />
                  Agregar pregunta
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Preguntas */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-brand-ink">
                Preguntas
                <span className="ml-2 text-sm font-normal text-brand-muted">
                  ({e.preguntas.length})
                </span>
              </h2>
            </div>
            {e.preguntas.length === 0 ? (
              <div className="rounded-xl border border-dashed border-brand-border bg-brand-paper/60 px-6 py-10 text-center text-sm text-brand-muted">
                Todavía no hay preguntas. Usa el formulario de arriba.
              </div>
            ) : (
              <ul className="space-y-2">
                {e.preguntas.map((p) => {
                  const config = (p.configuracion ?? {}) as Record<string, unknown>;
                  const editable = p.estado === "BORRADOR";
                  const estadoPregClass = ESTADO_PREG_STYLE[p.estado] ?? ESTADO_PREG_STYLE.BORRADOR;
                  return (
                    <li key={p.id}>
                      <Card className="border-brand-border bg-brand-paper shadow-none">
                        <CardContent className="p-4">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
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
                                <span className={`inline-flex items-center rounded px-1.5 py-0.5 font-bold uppercase tracking-wider ${estadoPregClass}`}>
                                  {p.estado}
                                </span>
                                <span className="text-brand-muted">
                                  · {VISIBILIDAD_LABEL[p.visibilidad] ?? p.visibilidad}
                                </span>
                                {p.opciones.length > 0 && (
                                  <span className="text-brand-muted">
                                    · {p.opciones.length} opciones
                                  </span>
                                )}
                              </div>
                            </div>
                            {editable && (
                              <form action={onEliminarPregunta}>
                                <input type="hidden" name="pid" value={p.id} />
                                <Button
                                  type="submit"
                                  variant="ghost"
                                  size="sm"
                                  className="text-brand-crimson hover:bg-brand-crimson/10 hover:text-brand-crimson-deep"
                                >
                                  <Trash2 aria-hidden className="size-3.5" />
                                  Eliminar
                                </Button>
                              </form>
                            )}
                          </div>

                          {editable ? (
                            <details className="mt-3 border-t border-brand-border pt-3">
                              <summary className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-brand-navy hover:text-brand-navy-deep">
                                <Pencil aria-hidden className="size-3.5" />
                                Editar
                              </summary>
                              <form
                                action={onActualizarPregunta}
                                className="mt-4 space-y-3"
                              >
                                <input type="hidden" name="pid" value={p.id} />
                                <input type="hidden" name="tipo" value={p.tipo} />
                                <div className="space-y-1.5">
                                  <Label className={labelCls}>Enunciado</Label>
                                  <Input
                                    name="enunciado"
                                    defaultValue={p.enunciado}
                                    required
                                    className={fieldCls}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className={labelCls}>Descripción (opcional)</Label>
                                  <textarea
                                    name="descripcion"
                                    defaultValue={p.descripcion ?? ""}
                                    rows={2}
                                    className={cn(fieldCls, "h-auto py-2")}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className={labelCls}>Visibilidad</Label>
                                  <select
                                    name="visibilidad"
                                    defaultValue={p.visibilidad}
                                    className={fieldCls}
                                  >
                                    <option value="OCULTO_HASTA_CERRAR">Oculto hasta cerrar</option>
                                    <option value="EN_VIVO">En vivo</option>
                                  </select>
                                </div>

                                {p.tipo === "OPCION_MULTIPLE" && (
                                  <>
                                    <div className="space-y-1.5">
                                      <Label className={labelCls}>Opciones (una por línea)</Label>
                                      <textarea
                                        name="opciones"
                                        defaultValue={p.opciones.map((o) => o.texto).join("\n")}
                                        rows={3}
                                        className={cn(fieldCls, "h-auto py-2 font-mono text-xs")}
                                      />
                                    </div>
                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                      <label className="flex items-center gap-2 text-xs">
                                        <input
                                          type="checkbox"
                                          name="permitirMultiple"
                                          defaultChecked={!!config.permitirMultiple}
                                          className="size-3.5 accent-brand-navy"
                                        />
                                        Permitir múltiples
                                      </label>
                                      <Input
                                        name="maxSelecciones"
                                        type="number"
                                        min={1}
                                        defaultValue={Number(config.maxSelecciones ?? 1)}
                                        className={fieldCls}
                                      />
                                    </div>
                                  </>
                                )}

                                {p.tipo === "ESCALA" && (
                                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                    <Input
                                      name="escalaMin"
                                      type="number"
                                      defaultValue={Number(config.min ?? 1)}
                                      className={fieldCls}
                                    />
                                    <Input
                                      name="escalaMax"
                                      type="number"
                                      defaultValue={Number(config.max ?? 5)}
                                      className={fieldCls}
                                    />
                                    <Input
                                      name="escalaEtiMin"
                                      defaultValue={String(config.etiquetaMin ?? "")}
                                      placeholder="Etiqueta min"
                                      className={fieldCls}
                                    />
                                    <Input
                                      name="escalaEtiMax"
                                      defaultValue={String(config.etiquetaMax ?? "")}
                                      placeholder="Etiqueta max"
                                      className={fieldCls}
                                    />
                                  </div>
                                )}

                                <Button
                                  type="submit"
                                  size="sm"
                                  className="bg-brand-navy text-white hover:bg-brand-navy-deep"
                                >
                                  <CheckCheck aria-hidden className="size-3.5" />
                                  Guardar cambios
                                </Button>
                              </form>
                            </details>
                          ) : (
                            <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-brand-muted">
                              <Lock aria-hidden className="size-3" />
                              Bloqueada — ya salió de borrador.
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        {/* Columna lateral: Invitados */}
        <aside className="lg:col-span-1">
          <Card className="border-brand-border bg-brand-paper shadow-none lg:sticky lg:top-20">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-lg font-semibold text-brand-ink">
                Invitados
                <span className="ml-2 text-sm font-normal text-brand-muted">
                  ({e.invitados.length})
                </span>
              </CardTitle>
              <CardDescription className="text-xs text-brand-muted">
                Solo votantes invitados podrán participar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {e.invitados.length > 0 && (
                <ul className="space-y-1">
                  {e.invitados.map((i) => (
                    <li
                      key={i.userId}
                      className="flex items-center justify-between gap-2 rounded-md px-1 py-1.5 text-sm transition-colors hover:bg-brand-cream"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-brand-ink">{i.user.nombre}</p>
                        <p className="truncate text-[11px] text-brand-muted">
                          {i.user.email}
                        </p>
                      </div>
                      <form action={onDesinvitar}>
                        <input type="hidden" name="userId" value={i.userId} />
                        <Button
                          type="submit"
                          variant="ghost"
                          size="icon"
                          aria-label={`Quitar a ${i.user.nombre}`}
                          className="size-7 text-brand-muted hover:bg-brand-crimson/10 hover:text-brand-crimson"
                        >
                          <UserMinus aria-hidden className="size-3.5" />
                        </Button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}

              {e.invitados.length > 0 && usuariosDisponibles.length > 0 && (
                <Separator className="bg-brand-border" />
              )}

              {usuariosDisponibles.length === 0 ? (
                <p className="text-xs text-brand-muted">
                  No hay más votantes activados disponibles.{" "}
                  <Link
                    href="/admin/usuarios"
                    className="text-brand-navy underline-offset-2 hover:underline"
                  >
                    Crea uno nuevo
                  </Link>
                  .
                </p>
              ) : (
                <form action={onInvitar} className="space-y-2">
                  <Label className={labelCls}>
                    Agregar ({usuariosDisponibles.length} disponible
                    {usuariosDisponibles.length === 1 ? "" : "s"})
                  </Label>
                  <p className="text-[11px] text-brand-muted">
                    Selecciona uno o varios (⌘/Ctrl + click).
                  </p>
                  <select
                    name="userId"
                    multiple
                    size={Math.min(6, usuariosDisponibles.length)}
                    className={cn(fieldCls, "h-auto py-1 text-xs")}
                  >
                    {usuariosDisponibles.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nombre} — {u.email}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="submit"
                    size="sm"
                    className="w-full bg-brand-navy text-white hover:bg-brand-navy-deep"
                  >
                    <UserPlus aria-hidden className="size-3.5" />
                    Invitar seleccionados
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
