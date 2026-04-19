import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { finalizarEvento } from "@/server/eventos";
import { registrarAudit } from "@/lib/audit";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  if (!session || session.user.rol !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  try {
    const e = await finalizarEvento(id);
    await registrarAudit({
      userId: session.user.id,
      accion: "evento.finalizar",
      targetId: id,
      metadata: { nombre: e.nombre },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
