import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { registrarVoto } from "@/server/votos";

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.rol !== "VOTANTE") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  try {
    const body = await req.json();
    const result = await registrarVoto({ ...body, userId: session.user.id });
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
