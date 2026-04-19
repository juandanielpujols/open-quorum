import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { registrarVoto } from "@/server/votos";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.rol !== "VOTANTE") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const rl = checkRateLimit(`voto:${session.user.id}`, 30, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate limit" },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rl.retryAfterMs ?? 1000) / 1000)) },
      },
    );
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
