/**
 * Servicio de email vía Resend.
 *
 * Operación:
 * - Si RESEND_API_KEY no está configurado → no-op silencioso (útil en dev/tests).
 * - Cada envío se registra en EmailLog para auditar: destinatario, tipo, éxito/error.
 * - Fallos de envío NO propagan al caller — un email caído no rompe un signup.
 *
 * Residual risk: no tenemos rate-limit por destinatario (mitigación contra abuso
 * de reenvíos). Agregar antes de prod pública.
 */

import { prisma } from "./db";
import type { Prisma } from "@/generated/prisma";

const FROM = process.env.EMAIL_FROM ?? "Open Quorum <noreply@example.com>";

type TipoEmail =
  | "activacion"
  | "evento.abierto"
  | "evento.recordatorio"
  | "evento.finalizado";

type EnviarEmailArgs = {
  to: string;
  userId?: string | null;
  tipo: TipoEmail;
  subject: string;
  html: string;
  contexto?: Record<string, unknown>;
};

export async function enviarEmail(args: EnviarEmailArgs): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    // Dev / sin config: log al servidor y a la DB, no envío real
    console.info(`[email] (dry-run) ${args.tipo} → ${args.to} · "${args.subject}"`);
    await registrarLog(args, null, "RESEND_API_KEY no configurado — dry run");
    return false;
  }

  try {
    // Lazy import para no cargar resend si no se usa
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from: FROM,
      to: args.to,
      subject: args.subject,
      html: args.html,
    });
    if (result.error) {
      await registrarLog(args, null, result.error.message);
      return false;
    }
    await registrarLog(args, null, null);
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await registrarLog(args, null, msg);
    return false;
  }
}

async function registrarLog(args: EnviarEmailArgs, _unused: null, error: string | null) {
  try {
    await prisma.emailLog.create({
      data: {
        userId: args.userId ?? "anonimo",
        tipo: args.tipo,
        contexto: (args.contexto as Prisma.InputJsonValue) ?? undefined,
        error,
      },
    });
  } catch {
    // best-effort; no romper si DB falla
  }
}

// ===== Templates =====
// HTML simple, responsive básico, sin dependencia de react-email.
// Cada template recibe los datos necesarios y devuelve { subject, html }.

export function templateActivacion(opts: {
  appName: string;
  nombre: string;
  activacionUrl: string;
}) {
  return {
    subject: `${opts.appName}: activa tu cuenta`,
    html: wrap(
      opts.appName,
      `
        <h1>Bienvenido, ${escape(opts.nombre)}</h1>
        <p>Tu cuenta fue creada. Para activarla y establecer una contraseña,
        visita el siguiente enlace:</p>
        <p><a href="${escape(opts.activacionUrl)}" style="display:inline-block;background:#1E3A5F;color:#F8F6F1;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Activar cuenta</a></p>
        <p style="font-size:12px;color:#64748B">Si el botón no funciona, copia esta URL: ${escape(opts.activacionUrl)}</p>
        <p style="font-size:12px;color:#64748B">El enlace expira en 7 días.</p>
      `,
    ),
  };
}

export function templateEventoAbierto(opts: {
  appName: string;
  nombreEvento: string;
  cierreAt?: Date;
  url: string;
}) {
  const cierre = opts.cierreAt
    ? `<p>Cierre: <strong>${opts.cierreAt.toLocaleString("es-DO")}</strong></p>`
    : "";
  return {
    subject: `${opts.appName}: ${opts.nombreEvento} está abierto para votación`,
    html: wrap(
      opts.appName,
      `
        <h1>${escape(opts.nombreEvento)}</h1>
        <p>Ya puedes participar en esta votación.</p>
        ${cierre}
        <p><a href="${escape(opts.url)}" style="display:inline-block;background:#1E3A5F;color:#F8F6F1;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Ir a votar</a></p>
      `,
    ),
  };
}

export function templateRecordatorio(opts: {
  appName: string;
  nombreEvento: string;
  url: string;
  mensaje?: string;
}) {
  return {
    subject: `${opts.appName}: recordatorio — ${opts.nombreEvento}`,
    html: wrap(
      opts.appName,
      `
        <h1>Recordatorio</h1>
        <p>${opts.mensaje ? escape(opts.mensaje) : `Aún no has participado en <strong>${escape(opts.nombreEvento)}</strong>. La votación sigue abierta.`}</p>
        <p><a href="${escape(opts.url)}" style="display:inline-block;background:#1E3A5F;color:#F8F6F1;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Votar ahora</a></p>
      `,
    ),
  };
}

export function templateEventoFinalizado(opts: {
  appName: string;
  nombreEvento: string;
  pdfUrl: string;
}) {
  return {
    subject: `${opts.appName}: resumen de ${opts.nombreEvento}`,
    html: wrap(
      opts.appName,
      `
        <h1>${escape(opts.nombreEvento)} — cerrado</h1>
        <p>El evento ha finalizado. Puedes descargar el resumen en PDF:</p>
        <p><a href="${escape(opts.pdfUrl)}" style="display:inline-block;background:#1E3A5F;color:#F8F6F1;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Descargar PDF</a></p>
      `,
    ),
  };
}

function wrap(appName: string, body: string): string {
  return `<!doctype html>
<html lang="es">
<head><meta charset="utf-8"/><title>${escape(appName)}</title></head>
<body style="margin:0;background:#F8F6F1;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif;color:#334155">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F8F6F1;padding:40px 16px">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:12px;box-shadow:0 1px 3px rgba(15,31,58,0.08)">
        <tr><td style="padding:32px 40px 20px;border-bottom:1px solid #E5E1D8">
          <p style="margin:0;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#0F1F3A;font-size:12px">${escape(appName)}</p>
        </td></tr>
        <tr><td style="padding:28px 40px 40px;font-size:15px;line-height:1.6;color:#334155">
          ${body}
        </td></tr>
        <tr><td style="padding:18px 40px 32px;color:#64748B;font-size:11px;border-top:1px solid #E5E1D8">
          Este correo es automatizado. No respondas a esta dirección.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
