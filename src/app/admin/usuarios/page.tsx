import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { crearUsuarioInvitado } from "@/server/usuarios";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });

  async function onCrear(fd: FormData) {
    "use server";
    const session = await auth();
    if (!session || session.user.rol !== "ADMIN") throw new Error("forbidden");
    await crearUsuarioInvitado({
      email: String(fd.get("email")),
      nombre: String(fd.get("nombre")),
      rol: String(fd.get("rol")) as "ADMIN" | "REVIEWER" | "VOTANTE",
      creadoPor: session.user.id,
    });
    revalidatePath("/admin/usuarios");
  }

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-semibold mb-4">Usuarios</h1>

      <section className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
        <h2 className="font-semibold mb-3">Invitar usuario</h2>
        <form action={onCrear} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <input
            name="email"
            type="email"
            required
            placeholder="email"
            className="border border-gray-200 rounded-lg p-2 sm:col-span-2"
          />
          <input
            name="nombre"
            required
            placeholder="Nombre"
            className="border border-gray-200 rounded-lg p-2"
          />
          <select name="rol" className="border border-gray-200 rounded-lg p-2">
            <option value="VOTANTE">Votante</option>
            <option value="REVIEWER">Reviewer</option>
            <option value="ADMIN">Admin</option>
          </select>
          <button className="bg-sb-azul text-white rounded-lg p-2 sm:col-span-4">
            Crear + generar link de activación
          </button>
        </form>
        <p className="text-xs text-sb-gris mt-2">
          Tras crear, copia el link de activación desde la tabla y compártelo
          con la persona. (Envío por email en Fase 2.)
        </p>
      </section>

      <table className="w-full text-sm border-collapse bg-white rounded-xl overflow-hidden">
        <thead className="text-left text-sb-gris bg-sb-grisFondo">
          <tr>
            <th className="p-2">Email</th>
            <th className="p-2">Nombre</th>
            <th className="p-2">Rol</th>
            <th className="p-2">Estado</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-t border-gray-100">
              <td className="p-2">{u.email}</td>
              <td className="p-2">{u.nombre}</td>
              <td className="p-2">{u.rol}</td>
              <td className="p-2">
                {u.activado ? (
                  <span className="text-sb-verde">✓ Activado</span>
                ) : (
                  <code className="text-xs bg-sb-fondoClaro px-1.5 py-0.5 rounded">
                    /activar?t={u.tokenActivacion}
                  </code>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
