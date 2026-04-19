import Link from "next/link";
import { auth } from "@/lib/auth";
import {
  listarProviders,
  crearProvider,
  actualizarProvider,
  eliminarProvider,
  alternarHabilitado,
  TIPOS_PROVIDER,
} from "@/server/auth-providers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProviderFormDialog } from "@/components/providers/provider-form-dialog";
import { KeyRound, Trash2, CheckCircle2, XCircle, Shield } from "lucide-react";
import type { AuthProvider } from "@/generated/prisma";

export const dynamic = "force-dynamic";

function parseFormData(fd: FormData) {
  return {
    tipo: String(fd.get("tipo")) as "OIDC_GENERIC" | "GOOGLE" | "AZURE_AD" | "KEYCLOAK",
    nombre: String(fd.get("nombre") ?? ""),
    clientId: String(fd.get("clientId") ?? ""),
    clientSecret: String(fd.get("clientSecret") ?? ""),
    issuer: String(fd.get("issuer") ?? ""),
    tenantId: String(fd.get("tenantId") ?? ""),
    hostedDomain: String(fd.get("hostedDomain") ?? ""),
    rolDefault: (String(fd.get("rolDefault") ?? "VOTANTE")) as "ADMIN" | "REVIEWER" | "VOTANTE",
    habilitado: fd.get("habilitado") === "on",
    orden: Number(fd.get("orden") ?? 0),
  };
}

export default async function ProvidersPage() {
  const session = await auth();
  if (!session || session.user.rol !== "ADMIN") redirect("/");

  const providers = await listarProviders();

  async function onCrear(fd: FormData) {
    "use server";
    const s = await auth();
    if (!s || s.user.rol !== "ADMIN") throw new Error("forbidden");
    await crearProvider(parseFormData(fd), s.user.id);
    revalidatePath("/admin/configuracion/providers");
  }

  async function onActualizar(fd: FormData) {
    "use server";
    const s = await auth();
    if (!s || s.user.rol !== "ADMIN") throw new Error("forbidden");
    const id = String(fd.get("id"));
    await actualizarProvider(id, parseFormData(fd), s.user.id);
    revalidatePath("/admin/configuracion/providers");
  }

  async function onEliminar(fd: FormData) {
    "use server";
    const s = await auth();
    if (!s || s.user.rol !== "ADMIN") throw new Error("forbidden");
    await eliminarProvider(String(fd.get("id")), s.user.id);
    revalidatePath("/admin/configuracion/providers");
  }

  async function onToggle(fd: FormData) {
    "use server";
    const s = await auth();
    if (!s || s.user.rol !== "ADMIN") throw new Error("forbidden");
    await alternarHabilitado(
      String(fd.get("id")),
      fd.get("habilitado") === "true",
      s.user.id,
    );
    revalidatePath("/admin/configuracion/providers");
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 lg:px-8 lg:py-10">
      <header className="mb-8">
        <nav className="mb-3 text-xs text-brand-muted">
          <Link href="/admin/configuracion" className="hover:text-brand-ink hover:underline">
            Configuración
          </Link>
          <span className="mx-2 text-brand-muted/50">/</span>
          <span>Proveedores de identidad</span>
        </nav>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 font-display text-3xl font-semibold tracking-tight text-brand-ink">
              <Shield aria-hidden className="size-7 text-brand-navy" />
              Proveedores de identidad
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-brand-muted">
              Configura login SSO con Google, Azure AD, Keycloak u otro OIDC. Los
              secrets se encriptan en DB con AES-GCM + AUTH_SECRET. El login con
              credenciales siempre queda disponible como fallback.
            </p>
          </div>
          <ProviderFormDialog onSave={onCrear} />
        </div>
      </header>

      {providers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-brand-border bg-brand-paper/60 px-6 py-12 text-center">
          <KeyRound aria-hidden className="mx-auto mb-3 size-10 text-brand-muted" />
          <h2 className="font-display text-lg font-semibold text-brand-ink">
            Aún no hay proveedores configurados
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-brand-muted">
            Los usuarios pueden ingresar solo con correo + contraseña. Agrega un
            proveedor para habilitar SSO.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {providers.map((p) => {
            const meta = TIPOS_PROVIDER[p.tipo as keyof typeof TIPOS_PROVIDER];
            return (
              <li key={p.id}>
                <Card className="border-brand-border bg-brand-paper shadow-none">
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {p.habilitado ? (
                            <CheckCircle2 aria-hidden className="size-4 text-emerald-600" />
                          ) : (
                            <XCircle aria-hidden className="size-4 text-brand-muted" />
                          )}
                          <h3 className="font-display text-lg font-semibold text-brand-ink">
                            {p.nombre}
                          </h3>
                          <span className="rounded bg-brand-cream-deep px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-body">
                            {meta?.label ?? p.tipo}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-brand-muted">
                          Rol default: <span className="font-medium">{p.rolDefault}</span>
                          {p.issuer && (
                            <>
                              {" · "}
                              <span className="font-mono">{p.issuer}</span>
                            </>
                          )}
                          {p.hostedDomain && <> · <span>@{p.hostedDomain}</span></>}
                        </p>
                        <p className="mt-0.5 font-mono text-[11px] text-brand-muted">
                          Client ID: {p.clientId.slice(0, 12)}…
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <form action={onToggle}>
                          <input type="hidden" name="id" value={p.id} />
                          <input type="hidden" name="habilitado" value={String(!p.habilitado)} />
                          <Button
                            type="submit"
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 text-brand-muted hover:text-brand-ink"
                          >
                            {p.habilitado ? "Deshabilitar" : "Habilitar"}
                          </Button>
                        </form>
                        <ProviderFormDialog
                          existente={p as unknown as AuthProvider}
                          onSave={onActualizar}
                        />
                        <form action={onEliminar}>
                          <input type="hidden" name="id" value={p.id} />
                          <Button
                            type="submit"
                            variant="ghost"
                            size="sm"
                            className="text-brand-crimson hover:bg-brand-crimson/10 hover:text-brand-crimson-deep"
                          >
                            <Trash2 aria-hidden className="size-3.5" />
                          </Button>
                        </form>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-8 rounded-lg border border-brand-border bg-brand-cream/60 p-4 text-xs text-brand-body">
        <p className="font-bold uppercase tracking-wider text-brand-muted">Redirect URI de cada proveedor</p>
        <p className="mt-1">
          Configura en el dashboard del IdP:
          <code className="ml-1 rounded bg-brand-paper px-1.5 py-0.5 font-mono text-[11px]">
            {process.env.AUTH_URL ?? "https://tu-dominio"}/api/auth/callback/oidc
          </code>
          {" "}(el `id` del provider en el URL es siempre <code>oidc</code> para genéricos; <code>google</code>, <code>azure-ad</code> o <code>keycloak</code> para presets).
        </p>
      </div>
    </div>
  );
}
