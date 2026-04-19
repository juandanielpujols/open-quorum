import { prisma } from "@/lib/db";
import { ProvidersButtons } from "./providers-buttons";

/**
 * Server component — lee providers habilitados de DB y se los pasa al
 * client component que dispara `signIn()`.
 * Tolerante a DB no disponible (silenciosamente no renderiza nada).
 */
export async function ProvidersSlot() {
  let providers: { id: string; nombre: string; tipo: string }[] = [];
  try {
    providers = await prisma.authProvider.findMany({
      where: { habilitado: true },
      orderBy: [{ orden: "asc" }, { nombre: "asc" }],
      select: { id: true, nombre: true, tipo: true },
    });
  } catch {
    return null;
  }
  if (providers.length === 0) return null;
  return <ProvidersButtons providers={providers} />;
}
