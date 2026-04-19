import { auth } from "@/lib/auth";
import { crearStreamEvento } from "@/lib/sse";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  if (!session) return new Response("unauthorized", { status: 401 });

  if (session.user.rol === "VOTANTE") {
    const inv = await prisma.eventoInvitacion.findUnique({
      where: { eventoId_userId: { eventoId: id, userId: session.user.id } },
    });
    if (!inv) return new Response("forbidden", { status: 403 });
  }

  const stream = crearStreamEvento(id);
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
