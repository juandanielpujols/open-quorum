import { auth } from "@/lib/auth";
import { crearEvento } from "@/server/eventos";
import { redirect } from "next/navigation";

export default async function NuevoEventoPage() {
  async function onCrear(fd: FormData) {
    "use server";
    const session = await auth();
    if (!session) throw new Error("auth");
    const modo = String(fd.get("modo")) as "VIVO" | "ASINCRONO";
    const evento = await crearEvento({
      nombre: String(fd.get("nombre")),
      descripcion: String(fd.get("descripcion") ?? "") || undefined,
      modo,
      inicioAt:
        modo === "ASINCRONO" ? new Date(String(fd.get("inicioAt"))) : undefined,
      cierreAt:
        modo === "ASINCRONO" ? new Date(String(fd.get("cierreAt"))) : undefined,
      maxPoderesPorProxy: Number(fd.get("maxPoderes")) || undefined,
      creadoPor: session.user.id,
    });
    redirect(`/eventos/${evento.id}`);
  }
  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-semibold mb-4">Nuevo evento</h1>
      <form action={onCrear} className="space-y-3">
        <input
          name="nombre"
          placeholder="Nombre"
          required
          className="w-full border border-gray-200 rounded-lg p-2"
        />
        <textarea
          name="descripcion"
          placeholder="Descripción (opcional)"
          className="w-full border border-gray-200 rounded-lg p-2"
        />
        <select name="modo" className="w-full border border-gray-200 rounded-lg p-2">
          <option value="VIVO">Vivo</option>
          <option value="ASINCRONO">Asíncrono</option>
        </select>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="datetime-local"
            name="inicioAt"
            className="border border-gray-200 rounded-lg p-2"
          />
          <input
            type="datetime-local"
            name="cierreAt"
            className="border border-gray-200 rounded-lg p-2"
          />
        </div>
        <input
          type="number"
          name="maxPoderes"
          placeholder="Máx. poderes por proxy (opcional)"
          className="w-full border border-gray-200 rounded-lg p-2"
        />
        <button className="bg-sb-azul text-white px-4 py-2 rounded-lg">Crear</button>
      </form>
    </div>
  );
}
