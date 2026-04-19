import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { crearUsuarioInvitado } from "@/server/usuarios";

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.rol !== "ADMIN") {
    return NextResponse.json({ error: "no autorizado" }, { status: 403 });
  }
  const body = await req.json();
  try {
    const user = await crearUsuarioInvitado({ ...body, creadoPor: session.user.id });
    // Fase 2: enviar email. Por ahora el admin ve el link en la UI.
    return NextResponse.json({
      id: user.id,
      email: user.email,
      linkActivacion: `/activar?t=${user.tokenActivacion}`,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
