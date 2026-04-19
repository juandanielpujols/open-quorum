import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { registrarAudit } from "@/lib/audit";
import { timingSafeEqual } from "node:crypto";

/**
 * Endpoint de cron — cierra eventos ASINCRONO con cierreAt < now y estado ACTIVO.
 *
 * Seguridad: requiere header `Authorization: Bearer <CRON_SECRET>` con comparación
 * constante-en-tiempo. Si CRON_SECRET no está configurado, rechaza todo.
 *
 * Llamadores recomendados:
 *   - Vercel Cron: `vercel.json` { "crons": [{ "path": "/api/cron/cerrar-vencidos", "schedule": "every 10 minutes" }] }
 *   - GitHub Actions: workflow con `cron: '*\/10 * * * *'` y `curl -H "Authorization: Bearer $CRON_SECRET" ...`
 *   - systemd timer, cron de Linux, etc.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function equalsSeguro(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

export async function POST(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET no configurado" },
      { status: 503 },
    );
  }
  const auth = req.headers.get("authorization") ?? "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!equalsSeguro(bearer, cronSecret)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const ahora = new Date();
  const vencidos = await prisma.evento.findMany({
    where: {
      modo: "ASINCRONO",
      estado: "ACTIVO",
      cierreAt: { lt: ahora },
    },
    select: { id: true, nombre: true },
  });

  if (vencidos.length === 0) {
    return NextResponse.json({ ok: true, cerrados: 0 });
  }

  const ids = vencidos.map((e) => e.id);
  await prisma.evento.updateMany({
    where: { id: { in: ids } },
    data: { estado: "FINALIZADO" },
  });

  for (const e of vencidos) {
    await registrarAudit({
      userId: null,
      accion: "evento.finalizar",
      targetId: e.id,
      metadata: { nombre: e.nombre, via: "cron" },
    });
  }

  return NextResponse.json({
    ok: true,
    cerrados: vencidos.length,
    ids,
  });
}

// Permitir GET también para runners que no soportan POST sin body
export const GET = POST;
