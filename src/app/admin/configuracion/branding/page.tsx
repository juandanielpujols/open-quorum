import { auth } from "@/lib/auth";
import {
  obtenerBranding,
  actualizarBranding,
  TEMAS,
  TEMA_IDS,
  type TemaId,
  esTemaValido,
} from "@/lib/branding";
import { revalidatePath } from "next/cache";
import { revalidateTag } from "next/cache";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Check, Image as ImageIcon, Palette as PaletteIcon } from "lucide-react";
import { BrandMonogram } from "@/components/brand-mark";

export const dynamic = "force-dynamic";

const fieldCls =
  "h-10 w-full rounded-md border border-brand-border bg-brand-paper px-3 text-sm text-brand-ink placeholder:text-brand-muted/70 shadow-none focus-visible:border-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/15";

const labelCls =
  "text-[11px] font-bold uppercase tracking-[0.12em] text-brand-muted";

export default async function BrandingPage() {
  const branding = await obtenerBranding();

  async function guardarNombreLogo(fd: FormData) {
    "use server";
    const session = await auth();
    if (!session || session.user.rol !== "ADMIN") throw new Error("forbidden");
    await actualizarBranding({
      nombre: String(fd.get("nombre") ?? "").trim() || undefined,
      logoUrl: fd.get("logoUrl") !== null ? String(fd.get("logoUrl") ?? "") : undefined,
      updatedBy: session.user.id,
    });
    revalidatePath("/", "layout");
  }

  async function aplicarTema(fd: FormData) {
    "use server";
    const session = await auth();
    if (!session || session.user.rol !== "ADMIN") throw new Error("forbidden");
    const tema = String(fd.get("tema"));
    if (!esTemaValido(tema)) throw new Error("Tema inválido");
    await actualizarBranding({ tema, updatedBy: session.user.id });
    revalidatePath("/", "layout");
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 lg:px-8 lg:py-10">
      <header className="mb-8">
        <nav className="mb-3 text-xs text-brand-muted">
          <span>Configuración</span>
          <span className="mx-2 text-brand-muted/50">/</span>
          <span>Branding</span>
        </nav>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-brand-ink">
          Branding
        </h1>
        <p className="mt-1 text-sm text-brand-muted">
          Personaliza el nombre, logo y tema de color de tu instalación.
        </p>
      </header>

      <div className="space-y-6">
        {/* Identidad */}
        <Card className="border-brand-border bg-brand-paper shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 font-display text-lg font-semibold text-brand-ink">
              <ImageIcon aria-hidden className="size-4 text-brand-muted" />
              Identidad
            </CardTitle>
            <CardDescription className="text-xs text-brand-muted">
              Nombre visible en la barra lateral, el título de página y el proyector. El logo reemplaza el monograma CGR.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={guardarNombreLogo} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="nombre" className={labelCls}>
                    Nombre de la organización
                  </Label>
                  <Input
                    id="nombre"
                    name="nombre"
                    defaultValue={branding.nombre}
                    placeholder="Open Quorum"
                    className={fieldCls}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="logoUrl" className={labelCls}>
                    URL del logo (opcional)
                  </Label>
                  <Input
                    id="logoUrl"
                    name="logoUrl"
                    type="url"
                    defaultValue={branding.logoUrl ?? ""}
                    placeholder="https://ejemplo.com/logo.svg"
                    className={fieldCls}
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="rounded-lg border border-brand-border bg-brand-cream p-4">
                <p className={cn(labelCls, "mb-2")}>Vista previa</p>
                <div className="flex items-center gap-3 rounded-md bg-brand-navy-deep px-4 py-3 text-brand-cream">
                  {branding.logoUrl ? (
                    <img
                      src={branding.logoUrl}
                      alt={branding.nombre}
                      className="h-8 w-auto max-w-[120px] object-contain"
                    />
                  ) : (
                    <BrandMonogram className="text-xl text-brand-cream" />
                  )}
                  <div className="flex flex-col leading-tight">
                    <span className="font-display text-base font-semibold">
                      {branding.nombre || "Open Quorum"}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-cream/50">
                      Admin
                    </span>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="bg-brand-navy text-white hover:bg-brand-navy-deep"
              >
                Guardar identidad
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Tema */}
        <Card className="border-brand-border bg-brand-paper shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 font-display text-lg font-semibold text-brand-ink">
              <PaletteIcon aria-hidden className="size-4 text-brand-muted" />
              Tema de color
            </CardTitle>
            <CardDescription className="text-xs text-brand-muted">
              Selecciona una paleta. El cambio aplica inmediatamente a toda la instancia.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {TEMA_IDS.map((temaId) => (
                <TemaCard
                  key={temaId}
                  temaId={temaId}
                  actual={branding.tema as TemaId}
                  onApply={aplicarTema}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TemaCard({
  temaId,
  actual,
  onApply,
}: {
  temaId: TemaId;
  actual: TemaId;
  onApply: (fd: FormData) => Promise<void>;
}) {
  const tema = TEMAS[temaId];
  const activo = actual === temaId;
  return (
    <form action={onApply}>
      <input type="hidden" name="tema" value={temaId} />
      <button
        type="submit"
        className={cn(
          "group relative block w-full cursor-pointer overflow-hidden rounded-xl border bg-brand-paper p-4 text-left transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/30",
          activo
            ? "border-brand-navy ring-2 ring-brand-navy/20"
            : "border-brand-border hover:border-brand-navy/40 hover:shadow-sm",
        )}
      >
        {activo && (
          <span className="absolute right-3 top-3 inline-flex size-6 items-center justify-center rounded-full bg-brand-navy text-white">
            <Check aria-hidden className="size-3.5" />
          </span>
        )}
        {/* Swatch bar */}
        <div
          className="mb-3 h-14 overflow-hidden rounded-md border border-brand-border"
          style={{ background: tema.preview.fondo }}
        >
          <div className="flex h-full items-center gap-2 px-3">
            <span
              className="size-8 rounded-full ring-2 ring-white"
              style={{ background: tema.preview.primario }}
            />
            <span
              className="size-6 rounded-full ring-2 ring-white"
              style={{ background: tema.preview.acento }}
            />
          </div>
        </div>
        <p className="font-display text-base font-semibold text-brand-ink">
          {tema.nombre}
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-brand-muted">
          {tema.descripcion}
        </p>
      </button>
    </form>
  );
}
