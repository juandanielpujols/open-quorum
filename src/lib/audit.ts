import { prisma } from "./db";
import type { Prisma } from "@/generated/prisma";

/**
 * Helper centralizado para escribir AuditLog.
 * Todas las acciones sensibles deben pasar por acá para tener un trazo
 * homogéneo y consumible por un SIEM externo más adelante.
 *
 * Contratos:
 * - No falla el request si el log no puede escribirse (best-effort, swallow).
 * - Nunca loguea secretos (passwords, tokens, hashes).
 * - Metadata puede incluir IP, UA y otros datos de correlación.
 */
export type AccionAudit =
  // Auth
  | "login.success"
  | "login.fail"
  | "login.locked"
  | "logout"
  | "activacion.success"
  | "activacion.fail"
  // Usuarios
  | "usuario.crear"
  | "usuario.reinvitar"
  | "usuario.eliminar"
  // Eventos
  | "evento.crear"
  | "evento.activar"
  | "evento.finalizar"
  | "evento.eliminar"
  | "evento.invitar"
  | "evento.desinvitar"
  | "evento.invitar_todos"
  // Preguntas (ya existían)
  | "pregunta.abierta"
  | "pregunta.cerrada"
  | "pregunta.revelada"
  | "pregunta.crear"
  | "pregunta.editar"
  | "pregunta.eliminar"
  // Branding / config
  | "branding.actualizar"
  | "tag.crear"
  | "tag.actualizar"
  | "tag.eliminar";

export async function registrarAudit(params: {
  userId: string | null;
  accion: AccionAudit;
  targetId?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId ?? "anonimo",
        accion: params.accion,
        targetId: params.targetId ?? "",
        metadata: params.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  } catch {
    // No romper el flujo por un fallo de log — ver alertas / monitoreo externo
  }
}
