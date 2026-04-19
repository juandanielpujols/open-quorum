import Link from "next/link";
import { auth } from "@/lib/auth";
import { crearEvento } from "@/server/eventos";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ArrowLeft, Plus } from "lucide-react";

const fieldCls =
  "h-10 w-full rounded-md border border-brand-border bg-brand-paper px-3 text-sm text-brand-ink placeholder:text-brand-muted/70 shadow-none transition-[border-color,box-shadow] duration-150 ease-out focus-visible:border-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/15";

const labelCls =
  "text-[11px] font-bold uppercase tracking-[0.12em] text-brand-muted";

export default async function NuevoEventoPage() {
  async function onCrear(fd: FormData) {
    "use server";
    const session = await auth();
    if (!session) throw new Error("auth");
    const modo = String(fd.get("modo")) as "VIVO" | "ASINCRONO";
    const evento = await crearEvento({
      nombre: String(fd.get("nombre")),
      descripcion: String(fd.get("descripcion") ?? "") || undefined,
      modo,
      inicioAt:
        modo === "ASINCRONO" ? new Date(String(fd.get("inicioAt"))) : undefined,
      cierreAt:
        modo === "ASINCRONO" ? new Date(String(fd.get("cierreAt"))) : undefined,
      maxPoderesPorProxy: Number(fd.get("maxPoderes")) || undefined,
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
          <form action={onCrear} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nombre" className={labelCls}>
                Nombre del evento
              </Label>
              <Input
                id="nombre"
                name="nombre"
                required
                placeholder="Ej: Asamblea Anual 2026"
                className={fieldCls}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="descripcion" className={labelCls}>
                Descripción (opcional)
              </Label>
              <textarea
                id="descripcion"
                name="descripcion"
                rows={3}
                placeholder="Contexto del evento, agenda, etc."
                className={cn(fieldCls, "h-auto py-2")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="modo" className={labelCls}>
                Modo
              </Label>
              <select id="modo" name="modo" className={fieldCls}>
                <option value="VIVO">En vivo (asamblea presencial o remota)</option>
                <option value="ASINCRONO">Asíncrono (ventana de días)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="inicioAt" className={labelCls}>
                  Inicio (solo asíncrono)
                </Label>
                <Input
                  id="inicioAt"
                  type="datetime-local"
                  name="inicioAt"
                  className={fieldCls}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cierreAt" className={labelCls}>
                  Cierre (solo asíncrono)
                </Label>
                <Input
                  id="cierreAt"
                  type="datetime-local"
                  name="cierreAt"
                  className={fieldCls}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="maxPoderes" className={labelCls}>
                Máx. poderes por representante (opcional)
              </Label>
              <Input
                id="maxPoderes"
                type="number"
                name="maxPoderes"
                min={1}
                placeholder="Sin límite"
                className={fieldCls}
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                type="submit"
                className="bg-brand-navy text-white hover:bg-brand-navy-deep"
              >
                <Plus aria-hidden className="size-4" />
                Crear evento
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-brand-border text-brand-body hover:bg-brand-cream"
              >
                <Link href="/admin/eventos">Cancelar</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
