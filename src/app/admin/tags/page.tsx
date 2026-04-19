import { listarTags, crearTag, eliminarTag } from "@/server/tags";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export default async function TagsPage() {
  const tags = await listarTags();

  async function onCrear(fd: FormData) {
    "use server";
    await crearTag({
      nombre: String(fd.get("nombre") ?? ""),
      color: String(fd.get("color") ?? "#0d3048"),
    });
    revalidatePath("/tags");
  }

  async function onEliminar(fd: FormData) {
    "use server";
    await eliminarTag(String(fd.get("id")));
    revalidatePath("/tags");
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-4">Tags</h1>
      <form action={onCrear} className="flex gap-2 mb-6">
        <input
          name="nombre"
          placeholder="Nombre"
          className="border border-gray-200 rounded-lg p-2 flex-1"
          required
        />
        <input
          name="color"
          type="color"
          defaultValue="#0d3048"
          className="border border-gray-200 rounded-lg"
        />
        <button className="bg-sb-azul text-white px-4 rounded-lg">Crear</button>
      </form>
      <ul className="space-y-2">
        {tags.map((t) => (
          <li
            key={t.id}
            className="flex items-center gap-3 bg-white rounded-lg border border-gray-100 p-3"
          >
            <span
              className="w-4 h-4 rounded-full"
              style={{ background: t.color ?? "#5c7f91" }}
            />
            <span className="flex-1">{t.nombre}</span>
            <form action={onEliminar}>
              <input type="hidden" name="id" value={t.id} />
              <button className="text-sb-rojo text-sm">Eliminar</button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
