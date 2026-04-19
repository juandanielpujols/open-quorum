import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { obtenerSnapshotEvento } from "@/server/snapshot";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  if (session.user.rol === "VOTANTE") {
    const inv = await prisma.eventoInvitacion.findUnique({
      where: { eventoId_userId: { eventoId: id, userId: session.user.id } },
    });
    if (!inv) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const snap = await obtenerSnapshotEvento(id);
  if (!snap) return NextResponse.json({ error: "not found" }, { status: 404 });

  if (session.user.rol === "VOTANTE") {
    snap.preguntas = snap.preguntas.map((p) =>
      p.visibilidad === "OCULTO_HASTA_CERRAR" && p.estado !== "REVELADA"
        ? { ...p, agregado: null }
        : p,
    );
  }
  return NextResponse.json(snap);
}
