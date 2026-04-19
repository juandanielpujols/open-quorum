import Link from "next/link";
import { listarEventos } from "@/server/eventos";

export const dynamic = "force-dynamic";

export default async function EventosPage() {
  const eventos = await listarEventos();
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Eventos</h1>
        <Link
          href="/eventos/nuevo"
          className="bg-sb-azul text-white px-4 py-2 rounded-lg"
        >
          Nuevo evento
        </Link>
      </div>
      <ul className="space-y-2">
        {eventos.map((e) => (
          <li key={e.id} className="bg-white rounded-lg border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <Link href={`/eventos/${e.id}`} className="font-medium text-sb-azul">
                {e.nombre}
              </Link>
              <span className="text-xs text-sb-gris">
                {e.modo} · {e.estado} · {e._count.preguntas} preguntas · {e._count.invitados} invitados
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
