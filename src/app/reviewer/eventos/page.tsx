import Link from "next/link";
import { listarEventos } from "@/server/eventos";

export const dynamic = "force-dynamic";

export default async function ReviewerEventos() {
  const eventos = await listarEventos();
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Eventos (read-only)</h1>
      <ul className="space-y-2">
        {eventos.map((e) => (
          <li key={e.id} className="bg-white rounded-lg border border-gray-100 p-4">
            <Link href={`/reviewer/eventos/${e.id}`} className="font-medium text-brand-navy">
              {e.nombre}
            </Link>
            <p className="text-xs text-brand-muted">
              {e.modo} · {e.estado}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
