import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { abrirPregunta, cerrarPregunta, revelarPregunta } from "@/server/preguntas";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string; accion: string }> },
) {
  const { id, accion } = await params;
  const session = await auth();
  if (!session || session.user.rol !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  try {
    if (accion === "abrir") await abrirPregunta(id, session.user.id);
    else if (accion === "cerrar") await cerrarPregunta(id, session.user.id);
    else if (accion === "revelar") await revelarPregunta(id, session.user.id);
    else return NextResponse.json({ error: "acción inválida" }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
