import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Usuarios</h1>
      <table className="w-full text-sm border-collapse">
        <thead className="text-left text-sb-gris">
          <tr>
            <th className="p-2">Email</th>
            <th>Nombre</th>
            <th>Rol</th>
            <th>Activado</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-t border-gray-100">
              <td className="p-2">{u.email}</td>
              <td>{u.nombre}</td>
              <td>{u.rol}</td>
              <td>{u.activado ? "✓" : `/activar?t=${u.tokenActivacion}`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
