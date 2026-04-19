import { z } from "zod";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { cifrar, descifrar, enmascarar } from "@/lib/crypto";
import { registrarAudit } from "@/lib/audit";

export type TipoProvider = "OIDC_GENERIC" | "GOOGLE" | "AZURE_AD" | "KEYCLOAK";

export const TIPOS_PROVIDER: Record<
  TipoProvider,
  { label: string; descripcion: string; camposRequeridos: string[] }
> = {
  GOOGLE: {
    label: "Google Workspace",
    descripcion: "Cuentas de Google. Opcionalmente restringible a un dominio corporativo.",
    camposRequeridos: ["clientId", "clientSecret"],
  },
  AZURE_AD: {
    label: "Azure AD / Microsoft Entra",
    descripcion: "Cuentas corporativas de Microsoft 365.",
    camposRequeridos: ["clientId", "clientSecret", "tenantId"],
  },
  OIDC_GENERIC: {
    label: "OIDC genérico",
    descripcion: "Cualquier proveedor compatible con OpenID Connect (Okta, Auth0, Authentik...).",
    camposRequeridos: ["clientId", "clientSecret", "issuer"],
  },
  KEYCLOAK: {
    label: "Keycloak",
    descripcion: "Self-hosted con realm propio. Usa el issuer URL de tu realm.",
    camposRequeridos: ["clientId", "clientSecret", "issuer"],
  },
};

const inputSchema = z.object({
  tipo: z.enum(["OIDC_GENERIC", "GOOGLE", "AZURE_AD", "KEYCLOAK"]),
  nombre: z.string().trim().min(1).max(80),
  clientId: z.string().trim().min(1).max(500),
  clientSecret: z.string().trim().min(1).max(1000).optional(), // opcional en update
  issuer: z.string().trim().url().optional().or(z.literal("")),
  tenantId: z.string().trim().optional().or(z.literal("")),
  hostedDomain: z.string().trim().optional().or(z.literal("")),
  rolDefault: z.enum(["ADMIN", "REVIEWER", "VOTANTE"]).default("VOTANTE"),
  habilitado: z.boolean().default(true),
  orden: z.number().int().default(0),
});

export const listarProviders = cache(async () => {
  const rows = await prisma.authProvider.findMany({
    orderBy: [{ orden: "asc" }, { nombre: "asc" }],
  });
  // No devolver el secret descifrado — enmascarar para UI
  return rows.map((p) => ({
    ...p,
    clientSecretMask: enmascarar(p.clientId, 3),
    clientSecretEnc: undefined, // nunca llegar al cliente
  }));
});

export async function listarProvidersHabilitados() {
  return prisma.authProvider.findMany({
    where: { habilitado: true },
    orderBy: [{ orden: "asc" }, { nombre: "asc" }],
  });
}

export async function obtenerSecretDescifrado(providerId: string): Promise<string | null> {
  const p = await prisma.authProvider.findUnique({ where: { id: providerId } });
  if (!p) return null;
  try {
    return descifrar(p.clientSecretEnc);
  } catch {
    return null;
  }
}

export async function crearProvider(
  input: z.input<typeof inputSchema>,
  actorId: string,
) {
  const data = inputSchema.parse(input);
  if (!data.clientSecret) throw new Error("clientSecret requerido");

  const provider = await prisma.authProvider.create({
    data: {
      tipo: data.tipo,
      nombre: data.nombre,
      clientId: data.clientId,
      clientSecretEnc: cifrar(data.clientSecret),
      issuer: data.issuer || null,
      tenantId: data.tenantId || null,
      hostedDomain: data.hostedDomain || null,
      rolDefault: data.rolDefault,
      habilitado: data.habilitado,
      orden: data.orden,
      updatedBy: actorId,
    },
  });

  await registrarAudit({
    userId: actorId,
    accion: "branding.actualizar", // reutilizamos; auditar cambios de providers a nivel config
    targetId: provider.id,
    metadata: { tipo: data.tipo, nombre: data.nombre, op: "crear_provider" },
  });
  return provider;
}

export async function actualizarProvider(
  id: string,
  input: z.input<typeof inputSchema>,
  actorId: string,
) {
  const data = inputSchema.parse(input);
  const update: Record<string, unknown> = {
    tipo: data.tipo,
    nombre: data.nombre,
    clientId: data.clientId,
    issuer: data.issuer || null,
    tenantId: data.tenantId || null,
    hostedDomain: data.hostedDomain || null,
    rolDefault: data.rolDefault,
    habilitado: data.habilitado,
    orden: data.orden,
    updatedBy: actorId,
  };
  // Si el admin pega un nuevo secret, re-encriptar; si viene vacío, dejar el anterior
  if (data.clientSecret && data.clientSecret.trim()) {
    update.clientSecretEnc = cifrar(data.clientSecret);
  }

  const provider = await prisma.authProvider.update({ where: { id }, data: update });
  await registrarAudit({
    userId: actorId,
    accion: "branding.actualizar",
    targetId: id,
    metadata: {
      tipo: data.tipo,
      nombre: data.nombre,
      op: "actualizar_provider",
      rotatedSecret: !!(data.clientSecret && data.clientSecret.trim()),
    },
  });
  return provider;
}

export async function eliminarProvider(id: string, actorId: string) {
  await prisma.authProvider.delete({ where: { id } });
  await registrarAudit({
    userId: actorId,
    accion: "branding.actualizar",
    targetId: id,
    metadata: { op: "eliminar_provider" },
  });
}

export async function alternarHabilitado(
  id: string,
  habilitado: boolean,
  actorId: string,
) {
  const p = await prisma.authProvider.update({
    where: { id },
    data: { habilitado, updatedBy: actorId },
  });
  await registrarAudit({
    userId: actorId,
    accion: "branding.actualizar",
    targetId: id,
    metadata: { op: "toggle_provider", habilitado },
  });
  return p;
}
