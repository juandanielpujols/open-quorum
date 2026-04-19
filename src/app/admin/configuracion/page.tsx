import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Palette, Users, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default function ConfiguracionPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 lg:px-8 lg:py-10">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-brand-ink">
          Configuración
        </h1>
        <p className="mt-1 text-sm text-brand-muted">
          Gestiona quién accede y cómo se ve tu instancia.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ConfigCard
          href="/admin/usuarios"
          label="Usuarios"
          description="Invita administradores, reviewers y votantes. Controla activaciones."
          icon={Users}
        />
        <ConfigCard
          href="/admin/configuracion/branding"
          label="Branding"
          description="Nombre de la organización, logo y tema de color."
          icon={Palette}
        />
      </div>
    </div>
  );
}

function ConfigCard({
  href,
  label,
  description,
  icon: Icon,
}: {
  href: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/30 rounded-xl"
    >
      <Card className="border-brand-border bg-brand-paper shadow-none transition-all duration-150 ease-out group-hover:border-brand-navy/30 group-hover:shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 font-display text-lg font-semibold text-brand-ink">
            <Icon aria-hidden className="size-5 text-brand-navy" />
            {label}
          </CardTitle>
          <CardDescription className="text-sm text-brand-muted">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-brand-navy transition-all duration-150 ease-out group-hover:gap-2">
            Abrir
            <ArrowRight aria-hidden className="size-4" />
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
