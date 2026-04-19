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

export async function actualizarBranding(input: {
  nombre?: string;
  logoUrl?: string | null;
  tema?: TemaId;
  updatedBy: string;
}) {
  const data: Record<string, unknown> = { updatedBy: input.updatedBy };
  if (input.nombre !== undefined) data.nombre = input.nombre.trim();
  if (input.logoUrl !== undefined) data.logoUrl = input.logoUrl?.trim() || null;
  if (input.tema !== undefined) {
    if (!esTemaValido(input.tema)) throw new Error("Tema inválido");
    data.tema = input.tema;
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
