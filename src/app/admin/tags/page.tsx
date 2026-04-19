import { listarTags, crearTag, eliminarTag, actualizarTag } from "@/server/tags";
import { revalidatePath } from "next/cache";
import { TagsManager } from "@/components/tags/tags-manager";

export const dynamic = "force-dynamic";

export default async function TagsPage() {
  const tags = await listarTags();

  async function onCrear(fd: FormData) {
    "use server";
    await crearTag({
      nombre: String(fd.get("nombre") ?? ""),
      color: String(fd.get("color") ?? "#0d3048"),
    });
    revalidatePath("/admin/tags");
  }

  async function onEliminar(fd: FormData) {
    "use server";
    await eliminarTag(String(fd.get("id")));
    revalidatePath("/admin/tags");
  }

  async function onActualizarColor(fd: FormData) {
    "use server";
    await actualizarTag({
      id: String(fd.get("id")),
      color: String(fd.get("color")),
    });
    revalidatePath("/admin/tags");
  }

  async function onActualizarNombre(fd: FormData) {
    "use server";
    await actualizarTag({
      id: String(fd.get("id")),
      nombre: String(fd.get("nombre")),
    });
    revalidatePath("/admin/tags");
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 lg:px-8 lg:py-10">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-brand-ink">
          Tags
        </h1>
        <p className="mt-1 text-sm text-brand-muted">
          Categorías para clasificar eventos. Cada tag tiene un color distintivo.
        </p>
      </header>

      <TagsManager
        tags={tags}
        onCrear={onCrear}
        onEliminar={onEliminar}
        onActualizarColor={onActualizarColor}
        onActualizarNombre={onActualizarNombre}
      />
    </div>
  );
}
