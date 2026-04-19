import { NextResponse } from "next/server";
import { activarCuenta } from "@/server/activacion";

export async function POST(req: Request) {
  const body = await req.json();
  try {
    await activarCuenta(body);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
