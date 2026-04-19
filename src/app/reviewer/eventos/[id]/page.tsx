import { obtenerSnapshotEvento } from "@/server/snapshot";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ReviewerEventoDetalle({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const snap = await obtenerSnapshotEvento(id);
  if (!snap) return notFound();
  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-semibold mb-4">{snap.nombre}</h1>
      <ul className="space-y-3">
        {snap.preguntas.map((p) => (
          <li key={p.id} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium">
                {p.orden + 1}. {p.enunciado}
              </p>
              <span className="text-xs text-brand-muted">
                {p.tipo} · {p.estado} · {p.totalVotos} votos
              </span>
            </div>
            {p.agregado != null ? (
              <pre className="text-xs bg-brand-border rounded p-2 overflow-auto">
                {JSON.stringify(p.agregado, null, 2)}
              </pre>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
