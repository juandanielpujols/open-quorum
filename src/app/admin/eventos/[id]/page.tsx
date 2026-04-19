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

export const dynamic = "force-dynamic";

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

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold">{e.nombre}</h1>
          <p className="text-sm text-sb-gris">
            {e.modo} · {e.estado} · {e.preguntas.length} preguntas
          </p>
        </div>
        <div className="flex gap-2">
          {e.estado === "BORRADOR" && (
            <form action={onActivar}>
              <button className="bg-sb-verde text-white px-4 py-2 rounded-lg">Activar</button>
            </form>
          )}
          {e.estado === "ACTIVO" && (
            <Link
              href={`/admin/eventos/${e.id}/control`}
              className="bg-sb-azul text-white px-4 py-2 rounded-lg"
            >
              Control en vivo →
            </Link>
          )}
        </div>
      </div>

      <section className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
        <h2 className="font-semibold mb-3">Nueva pregunta</h2>
        <form action={onCrearPregunta} className="space-y-3">
          <input
            name="enunciado"
            placeholder="Enunciado"
            required
            className="w-full border border-gray-200 rounded-lg p-2"
          />
          <div className="grid grid-cols-2 gap-3">
            <select name="tipo" className="border border-gray-200 rounded-lg p-2">
              <option value="OPCION_MULTIPLE">Opción múltiple</option>
              <option value="SI_NO">Sí / No</option>
              <option value="ESCALA">Escala 1-5</option>
            </select>
            <select name="visibilidad" className="border border-gray-200 rounded-lg p-2">
              <option value="OCULTO_HASTA_CERRAR">Oculto hasta cerrar</option>
              <option value="EN_VIVO">En vivo</option>
            </select>
          </div>
          <textarea
            name="opciones"
            placeholder="Opciones (una por línea, ignorado para Sí/No y Escala)"
            className="w-full border border-gray-200 rounded-lg p-2 font-mono text-sm"
            rows={4}
          />
          <details className="text-sm">
            <summary className="cursor-pointer">Opciones de tipo</summary>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" name="permitirMultiple" /> Permitir múltiples (MC)
              </label>
              <input
                name="maxSelecciones"
                type="number"
                defaultValue="1"
                className="border border-gray-200 rounded-lg p-2"
              />
              <input
                name="escalaMin"
                type="number"
                defaultValue="1"
                className="border border-gray-200 rounded-lg p-2"
              />
              <input
                name="escalaMax"
                type="number"
                defaultValue="5"
                className="border border-gray-200 rounded-lg p-2"
              />
              <input
                name="escalaEtiMin"
                placeholder="Etiqueta min (Escala)"
                className="border border-gray-200 rounded-lg p-2"
              />
              <input
                name="escalaEtiMax"
                placeholder="Etiqueta max (Escala)"
                className="border border-gray-200 rounded-lg p-2"
              />
            </div>
          </details>
          <button className="bg-sb-azul text-white px-4 py-2 rounded-lg">
            Agregar pregunta
          </button>
        </form>
      </section>

      <section className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
        <h2 className="font-semibold mb-3">
          Invitados ({e.invitados.length})
        </h2>

        {e.invitados.length > 0 && (
          <ul className="space-y-1 mb-4">
            {e.invitados.map((i) => (
              <li
                key={i.userId}
                className="flex items-center justify-between text-sm border-b border-gray-50 py-1 last:border-0"
              >
                <span>
                  {i.user.nombre}{" "}
                  <span className="text-sb-gris">· {i.user.email}</span>
                </span>
                <form action={onDesinvitar}>
                  <input type="hidden" name="userId" value={i.userId} />
                  <button className="text-sb-rojo text-xs">Quitar</button>
                </form>
              </li>
            ))}
          </ul>
        )}

        {usuariosDisponibles.length === 0 ? (
          <p className="text-sb-gris text-sm">
            No hay más votantes activados disponibles. Invita usuarios en{" "}
            <Link href="/admin/usuarios" className="underline">
              Usuarios
            </Link>{" "}
            primero.
          </p>
        ) : (
          <form action={onInvitar} className="space-y-2">
            <label className="block text-sm font-medium">
              Invitar votantes (Cmd/Ctrl+click para seleccionar varios)
            </label>
            <select
              name="userId"
              multiple
              size={Math.min(8, usuariosDisponibles.length)}
              className="w-full border border-gray-200 rounded-lg p-2"
            >
              {usuariosDisponibles.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre} — {u.email}
                </option>
              ))}
            </select>
            <button className="bg-sb-azul text-white px-4 py-2 rounded-lg text-sm">
              Invitar seleccionados
            </button>
          </form>
        )}
      </section>

      <section>
        <h2 className="font-semibold mb-3">Preguntas ({e.preguntas.length})</h2>
        <ul className="space-y-2">
          {e.preguntas.map((p) => {
            const config = (p.configuracion ?? {}) as Record<string, unknown>;
            const editable = p.estado === "BORRADOR";
            return (
              <li key={p.id} className="bg-white rounded-lg border border-gray-100 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {p.orden + 1}. {p.enunciado}
                    </p>
                    <p className="text-xs text-sb-gris">
                      {p.tipo} · {p.estado} · {p.visibilidad} · {p.opciones.length} opciones
                    </p>
                  </div>
                  {editable && (
                    <form action={onEliminarPregunta}>
                      <input type="hidden" name="pid" value={p.id} />
                      <button className="text-sb-rojo text-sm">Eliminar</button>
                    </form>
                  )}
                </div>

                {editable ? (
                  <details className="mt-3 border-t border-gray-100 pt-3">
                    <summary className="text-sm cursor-pointer text-sb-azul">
                      Editar
                    </summary>
                    <form action={onActualizarPregunta} className="mt-3 space-y-2">
                      <input type="hidden" name="pid" value={p.id} />
                      <input type="hidden" name="tipo" value={p.tipo} />
                      <input
                        name="enunciado"
                        defaultValue={p.enunciado}
                        required
                        className="w-full border border-gray-200 rounded-lg p-2 text-sm"
                      />
                      <textarea
                        name="descripcion"
                        defaultValue={p.descripcion ?? ""}
                        placeholder="Descripción (opcional)"
                        className="w-full border border-gray-200 rounded-lg p-2 text-sm"
                        rows={2}
                      />
                      <select
                        name="visibilidad"
                        defaultValue={p.visibilidad}
                        className="w-full border border-gray-200 rounded-lg p-2 text-sm"
                      >
                        <option value="OCULTO_HASTA_CERRAR">Oculto hasta cerrar</option>
                        <option value="EN_VIVO">En vivo</option>
                      </select>

                      {p.tipo === "OPCION_MULTIPLE" && (
                        <>
                          <textarea
                            name="opciones"
                            defaultValue={p.opciones.map((o) => o.texto).join("\n")}
                            placeholder="Opciones (una por línea)"
                            className="w-full border border-gray-200 rounded-lg p-2 text-sm font-mono"
                            rows={3}
                          />
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                name="permitirMultiple"
                                defaultChecked={!!config.permitirMultiple}
                              />
                              Permitir múltiples
                            </label>
                            <input
                              name="maxSelecciones"
                              type="number"
                              min={1}
                              defaultValue={Number(config.maxSelecciones ?? 1)}
                              className="border border-gray-200 rounded-lg p-2"
                            />
                          </div>
                        </>
                      )}

                      {p.tipo === "ESCALA" && (
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <input
                            name="escalaMin"
                            type="number"
                            defaultValue={Number(config.min ?? 1)}
                            className="border border-gray-200 rounded-lg p-2"
                          />
                          <input
                            name="escalaMax"
                            type="number"
                            defaultValue={Number(config.max ?? 5)}
                            className="border border-gray-200 rounded-lg p-2"
                          />
                          <input
                            name="escalaEtiMin"
                            defaultValue={String(config.etiquetaMin ?? "")}
                            placeholder="Etiqueta min"
                            className="border border-gray-200 rounded-lg p-2"
                          />
                          <input
                            name="escalaEtiMax"
                            defaultValue={String(config.etiquetaMax ?? "")}
                            placeholder="Etiqueta max"
                            className="border border-gray-200 rounded-lg p-2"
                          />
                        </div>
                      )}

                      <button className="bg-sb-azul text-white px-3 py-1.5 rounded-lg text-sm">
                        Guardar
                      </button>
                    </form>
                  </details>
                ) : (
                  <p className="mt-2 text-xs text-sb-gris italic">
                    🔒 Bloqueada para edición (ya no está en BORRADOR)
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
