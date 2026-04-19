import { obtenerSnapshotEvento } from "@/server/snapshot";
import { VotarClient } from "./VotarClient";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function VotarPage({
  params,
}: {
  params: Promise<{ eventoId: string }>;
}) {
  const { eventoId } = await params;
  const session = await auth();
  if (!session) redirect("/login");
  const inv = await prisma.eventoInvitacion.findUnique({
    where: { eventoId_userId: { eventoId, userId: session.user.id } },
  });
  if (!inv) redirect("/votante/eventos");
  const snap = await obtenerSnapshotEvento(eventoId);
  if (!snap) return notFound();
  return <VotarClient initial={snap} eventoId={eventoId} />;
}
