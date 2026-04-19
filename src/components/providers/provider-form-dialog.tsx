"use client";
import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AuthProvider } from "@/generated/prisma";

const fieldCls =
  "h-10 w-full rounded-md border border-brand-border bg-brand-paper px-3 text-sm text-brand-ink placeholder:text-brand-muted/70 shadow-none focus-visible:border-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/15";

const labelCls =
  "text-[11px] font-bold uppercase tracking-[0.12em] text-brand-muted";

type Tipo = "OIDC_GENERIC" | "GOOGLE" | "AZURE_AD" | "KEYCLOAK";

const TIPOS: Record<Tipo, { label: string; camposExtra: Array<"issuer" | "tenantId" | "hostedDomain"> }> = {
  GOOGLE: { label: "Google Workspace", camposExtra: ["hostedDomain"] },
  AZURE_AD: { label: "Azure AD / Entra", camposExtra: ["tenantId"] },
  OIDC_GENERIC: { label: "OIDC genérico", camposExtra: ["issuer"] },
  KEYCLOAK: { label: "Keycloak", camposExtra: ["issuer"] },
};

export function ProviderFormDialog({
  existente,
  onSave,
}: {
  existente?: AuthProvider;
  onSave: (fd: FormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [tipo, setTipo] = useState<Tipo>(
    (existente?.tipo as Tipo) ?? "OIDC_GENERIC",
  );

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await onSave(fd);
      setOpen(false);
    });
  }

  const esEdicion = !!existente;
  const camposExtra = TIPOS[tipo].camposExtra;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {esEdicion ? (
          <Button variant="ghost" size="sm" className="gap-1.5">
            <Pencil aria-hidden className="size-3.5" />
            Editar
          </Button>
        ) : (
          <Button className="bg-brand-navy text-white hover:bg-brand-navy-deep">
            <Plus aria-hidden className="size-4" />
            Nuevo proveedor
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-brand-border bg-brand-paper sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-brand-ink">
            {esEdicion ? "Editar proveedor" : "Nuevo proveedor"}
          </DialogTitle>
          <DialogDescription className="text-brand-body">
            {esEdicion
              ? "Actualiza los datos. El Client Secret solo se cambia si escribes uno nuevo."
              : "Configura un proveedor OIDC/OAuth para login SSO."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {esEdicion && <input type="hidden" name="id" value={existente.id} />}

          <div className="space-y-1.5">
            <Label htmlFor="tipo" className={labelCls}>Tipo</Label>
            <select
              id="tipo"
              name="tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value as Tipo)}
              className={fieldCls}
            >
              {Object.entries(TIPOS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="nombre" className={labelCls}>Nombre visible</Label>
            <Input
              id="nombre"
              name="nombre"
              required
              defaultValue={existente?.nombre ?? ""}
              placeholder="Ej: Acme Corp SSO"
              className={fieldCls}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="clientId" className={labelCls}>Client ID</Label>
            <Input
              id="clientId"
              name="clientId"
              required
              defaultValue={existente?.clientId ?? ""}
              placeholder="client_12345..."
              className={cn(fieldCls, "font-mono text-xs")}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="clientSecret" className={labelCls}>
              Client Secret {esEdicion && <span className="font-normal normal-case text-brand-muted/70">(opcional — deja vacío para conservar)</span>}
            </Label>
            <Input
              id="clientSecret"
              name="clientSecret"
              type="password"
              required={!esEdicion}
              placeholder={esEdicion ? "••••••••••" : "pega el secret aquí"}
              className={cn(fieldCls, "font-mono text-xs")}
            />
            <p className="text-[11px] text-brand-muted">
              Se encripta at-rest con AES-GCM antes de guardar.
            </p>
          </div>

          {camposExtra.includes("issuer") && (
            <div className="space-y-1.5">
              <Label htmlFor="issuer" className={labelCls}>Issuer URL</Label>
              <Input
                id="issuer"
                name="issuer"
                type="url"
                required
                defaultValue={existente?.issuer ?? ""}
                placeholder="https://keycloak.example.com/realms/..."
                className={cn(fieldCls, "font-mono text-xs")}
              />
            </div>
          )}

          {camposExtra.includes("tenantId") && (
            <div className="space-y-1.5">
              <Label htmlFor="tenantId" className={labelCls}>Tenant ID</Label>
              <Input
                id="tenantId"
                name="tenantId"
                required
                defaultValue={existente?.tenantId ?? ""}
                placeholder="xxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className={cn(fieldCls, "font-mono text-xs")}
              />
            </div>
          )}

          {camposExtra.includes("hostedDomain") && (
            <div className="space-y-1.5">
              <Label htmlFor="hostedDomain" className={labelCls}>Dominio permitido (opcional)</Label>
              <Input
                id="hostedDomain"
                name="hostedDomain"
                defaultValue={existente?.hostedDomain ?? ""}
                placeholder="tuorganizacion.com"
                className={fieldCls}
              />
              <p className="text-[11px] text-brand-muted">
                Deja vacío para permitir cualquier cuenta Google.
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="rolDefault" className={labelCls}>Rol default al primer login</Label>
            <select
              id="rolDefault"
              name="rolDefault"
              defaultValue={existente?.rolDefault ?? "VOTANTE"}
              className={fieldCls}
            >
              <option value="VOTANTE">Votante</option>
              <option value="REVIEWER">Reviewer</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              id="habilitado"
              name="habilitado"
              type="checkbox"
              defaultChecked={existente?.habilitado ?? true}
              className="size-4 accent-brand-navy"
            />
            <Label htmlFor="habilitado" className="text-sm text-brand-body">
              Habilitado (aparece en la página de login)
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
              className="border-brand-border text-brand-body hover:bg-brand-cream"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-brand-navy text-white hover:bg-brand-navy-deep"
            >
              {isPending && <Loader2 aria-hidden className="size-4 animate-spin" />}
              {esEdicion ? "Guardar cambios" : "Crear proveedor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
