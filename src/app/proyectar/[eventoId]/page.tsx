import { obtenerSnapshotEvento } from "@/server/snapshot";
import { ProjectorClient } from "./ProjectorClient";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProyectarPage({
  params,
}: {
  params: Promise<{ eventoId: string }>;
}) {
  const { eventoId } = await params;
  const snap = await obtenerSnapshotEvento(eventoId);
  if (!snap) return notFound();
  return <ProjectorClient initial={snap} eventoId={eventoId} />;
}
