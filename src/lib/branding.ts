import { cache } from "react";
import { prisma } from "./db";

export type TemaId = "institucional" | "esmeralda" | "carbon";

export type Tema = {
  id: TemaId;
  nombre: string;
  descripcion: string;
  preview: { primario: string; acento: string; fondo: string };
};

export const TEMAS: Record<TemaId, Tema> = {
  institucional: {
    id: "institucional",
    nombre: "Institucional",
    descripcion: "Navy profundo con acento crimson. Formal, clásico, confiable.",
    preview: { primario: "#1E3A5F", acento: "#C62828", fondo: "#F8F6F1" },
  },
  esmeralda: {
    id: "esmeralda",
    nombre: "Esmeralda",
    descripcion: "Verde esmeralda con ámbar cálido. Sobrio y orgánico.",
    preview: { primario: "#14532D", acento: "#A16207", fondo: "#FAF6EC" },
  },
  carbon: {
    id: "carbon",
    nombre: "Carbón",
    descripcion: "Grafito con teal. Moderno, reservado, técnico.",
    preview: { primario: "#1F2937", acento: "#0E7490", fondo: "#F4F3EE" },
  },
};

export const TEMA_IDS = Object.keys(TEMAS) as TemaId[];

export function esTemaValido(x: unknown): x is TemaId {
  return typeof x === "string" && x in TEMAS;
}

const SINGLETON_ID = "singleton";

const BRANDING_DEFAULT = {
  id: SINGLETON_ID,
  nombre: process.env.NEXT_PUBLIC_APP_NAME ?? "Open Quorum",
  logoUrl: null as string | null,
  tema: "institucional",
  updatedBy: null as string | null,
  updatedAt: new Date(0),
};

// Tolerante a DB no disponible en build-time (prerender estático).
// Cae a defaults si no puede conectar.
export const obtenerBranding = cache(async () => {
  try {
    const existente = await prisma.appBranding.findUnique({ where: { id: SINGLETON_ID } });
    if (existente) return existente;
    return await prisma.appBranding.create({
      data: {
        id: SINGLETON_ID,
        nombre: BRANDING_DEFAULT.nombre,
        tema: "institucional",
      },
    });
  } catch {
    return BRANDING_DEFAULT;
  }
});

import { z } from "zod";

/**
 * Validación de logoUrl — el logo se renderiza como <img src={logoUrl}> en
 * sidebar y login. Si no se valida, un admin malicioso (o uno comprometido)
 * podría inyectar `javascript:` o una URL interna para SSRF reflexivo o
 * ataques de leak de contexto (tokens en querystring, etc).
 *
 * Reglas: https:// o http://localhost (dev), dominio sano, max 2048 chars.
 */
const logoUrlSchema = z
  .string()
  .trim()
  .max(2048, "URL demasiado larga")
  .url("URL inválida")
  .refine(
    (u) => u.startsWith("https://") || u.startsWith("http://localhost"),
    "Solo https:// está permitido (o http://localhost en dev)",
  );

const nombreSchema = z.string().trim().min(1).max(120);

const temaSchema = z.enum(["institucional", "esmeralda", "carbon"]);

export async function actualizarBranding(input: {
  nombre?: string;
  logoUrl?: string | null;
  tema?: TemaId;
  updatedBy: string;
}) {
  const data: Record<string, unknown> = { updatedBy: input.updatedBy };
  if (input.nombre !== undefined) data.nombre = nombreSchema.parse(input.nombre);
  if (input.logoUrl !== undefined) {
    const limpio = input.logoUrl?.trim() ?? "";
    data.logoUrl = limpio.length === 0 ? null : logoUrlSchema.parse(limpio);
  }
  if (input.tema !== undefined) {
    data.tema = temaSchema.parse(input.tema);
  }
  return prisma.appBranding.upsert({
    where: { id: SINGLETON_ID },
    create: {
      id: SINGLETON_ID,
      nombre: (data.nombre as string) ?? "Open Quorum",
      logoUrl: (data.logoUrl as string | null) ?? null,
      tema: (data.tema as string) ?? "institucional",
      updatedBy: input.updatedBy,
    },
    update: data,
  });
}
