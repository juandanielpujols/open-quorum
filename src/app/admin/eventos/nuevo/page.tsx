import Link from "next/link";
import { auth } from "@/lib/auth";
import { crearEvento } from "@/server/eventos";
import { listarTags } from "@/server/tags";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { CrearEventoForm } from "./CrearEventoForm";

export default async function NuevoEventoPage() {
  const tags = await listarTags();

  async function onCrear(fd: FormData) {
    "use server";
    const session = await auth();
    if (!session) throw new Error("auth");
    const modo = String(fd.get("modo")) as "VIVO" | "ASINCRONO";
    const maxPoderesRaw = fd.get("maxPoderes");
    const maxPoderes =
      maxPoderesRaw === null || maxPoderesRaw === ""
        ? undefined
        : Number(maxPoderesRaw);
    const tagIds = fd.getAll("tagIds").map(String).filter(Boolean);
    const evento = await crearEvento({
      nombre: String(fd.get("nombre")),
      descripcion: String(fd.get("descripcion") ?? "") || undefined,
      modo,
      inicioAt:
        modo === "ASINCRONO" ? new Date(String(fd.get("inicioAt"))) : undefined,
      cierreAt:
        modo === "ASINCRONO" ? new Date(String(fd.get("cierreAt"))) : undefined,
      maxPoderesPorProxy: Number.isFinite(maxPoderes) ? maxPoderes : undefined,
      mostrarResultadosFinales: fd.get("mostrarResultadosFinales") === "on",
      tagIds: tagIds.length > 0 ? tagIds : undefined,
      creadoPor: session.user.id,
    });
    redirect(`/admin/eventos/${evento.id}`);
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 lg:px-8 lg:py-10">
      <header className="mb-6">
        <Link
          href="/admin/eventos"
          className="inline-flex items-center gap-1 text-xs text-brand-muted hover:text-brand-ink"
        >
          <ArrowLeft aria-hidden className="size-3" />
          Volver a eventos
        </Link>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-brand-ink">
          Nuevo evento
        </h1>
        <p className="mt-1 text-sm text-brand-muted">
          Se creará en estado borrador. Podrás editarlo antes de activarlo.
        </p>
      </header>

      <Card className="border-brand-border bg-brand-paper shadow-none">
        <CardHeader className="pb-4">
          <CardTitle className="font-display text-lg font-semibold text-brand-ink">
            Datos del evento
          </CardTitle>
          <CardDescription className="text-xs text-brand-muted">
            El modo asíncrono permite una ventana de votación con inicio y cierre automáticos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CrearEventoForm tags={tags} onCrear={onCrear} />
        </CardContent>
      </Card>
    </div>
  );
}
