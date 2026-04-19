import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { obtenerBranding } from "@/lib/branding";
import { generarPdfResumenEvento } from "@/lib/pdf/resumen-evento";
import { registrarAudit } from "@/lib/audit";
import type { Readable } from "node:stream";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session || (session.user.rol !== "ADMIN" && session.user.rol !== "REVIEWER")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const { id } = await params;

  try {
    const branding = await obtenerBranding();
    const { stream, evento } = await generarPdfResumenEvento(id, branding.nombre);

    await registrarAudit({
      userId: session.user.id,
      accion: "branding.actualizar",
      targetId: id,
      metadata: { op: "pdf_resumen_generado", evento: evento.nombre },
    });

    // Convertir Node Readable a Web ReadableStream
    const webStream = (stream as unknown as Readable);
    const filename = `${evento.nombre.replace(/[^\w\d-]+/g, "_")}_resumen.pdf`;

    // @react-pdf stream es Node Readable; Next 16 route handlers aceptan
    // Response con body de Readable ya que runtime=nodejs
    return new Response(webStream as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
