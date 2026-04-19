import Link from "next/link";
import { obtenerEvento, activarEvento } from "@/server/eventos";
import { crearPregunta, eliminarPregunta } from "@/server/preguntas";
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

  async function onActivar() {
    "use server";
    await activarEvento(id);
    revalidatePath(`/eventos/${id}`);
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
    revalidatePath(`/eventos/${id}`);
  }

  async function onEliminarPregunta(fd: FormData) {
    "use server";
    await eliminarPregunta(String(fd.get("pid")));
    revalidatePath(`/eventos/${id}`);
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
              href={`/eventos/${e.id}/control`}
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

      <section>
        <h2 className="font-semibold mb-3">Preguntas ({e.preguntas.length})</h2>
        <ul className="space-y-2">
          {e.preguntas.map((p) => (
            <li
              key={p.id}
              className="bg-white rounded-lg border border-gray-100 p-3 flex items-center justify-between"
            >
              <div>
                <p className="font-medium">
                  {p.orden + 1}. {p.enunciado}
                </p>
                <p className="text-xs text-sb-gris">
                  {p.tipo} · {p.estado} · {p.opciones.length} opciones
                </p>
              </div>
              <form action={onEliminarPregunta}>
                <input type="hidden" name="pid" value={p.id} />
                <button className="text-sb-rojo text-sm">Eliminar</button>
              </form>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
