import { obtenerSnapshotEvento } from "@/server/snapshot";
import { notFound } from "next/navigation";
import { ControlClient } from "./ControlClient";

export const dynamic = "force-dynamic";

export default async function ControlPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const snap = await obtenerSnapshotEvento(id);
  if (!snap) return notFound();
  return <ControlClient initial={snap} eventoId={id} />;
}
