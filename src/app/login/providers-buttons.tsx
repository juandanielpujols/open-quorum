"use client";
import { signIn } from "next-auth/react";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { useState } from "react";

const ICONO: Record<string, React.ReactNode> = {
  GOOGLE: (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.09-1.93 3.27-4.76 3.27-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.15-4.52H2.18v2.84A10.99 10.99 0 0012 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.85 14.11a6.6 6.6 0 010-4.22V7.05H2.18a11 11 0 000 9.9l3.67-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.2 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.67 2.84C6.71 7.3 9.14 5.38 12 5.38z"
      />
    </svg>
  ),
  AZURE_AD: (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4">
      <rect x="2" y="2" width="9.5" height="9.5" fill="#F25022" />
      <rect x="12.5" y="2" width="9.5" height="9.5" fill="#7FBA00" />
      <rect x="2" y="12.5" width="9.5" height="9.5" fill="#00A4EF" />
      <rect x="12.5" y="12.5" width="9.5" height="9.5" fill="#FFB900" />
    </svg>
  ),
  KEYCLOAK: (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4">
      <path
        d="M12 2L4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4z"
        fill="#008AAA"
      />
    </svg>
  ),
  OIDC_GENERIC: (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4">
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M12 6v12M9 9v6M15 9v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
};

export function ProvidersButtons({
  providers,
}: {
  providers: { id: string; nombre: string; tipo: string }[];
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  return (
    <div className="space-y-3">
      <div className="relative py-1 text-center">
        <div aria-hidden className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-brand-border" />
        <span className="relative inline-block bg-brand-cream px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-muted">
          o continúa con
        </span>
      </div>
      <div className="space-y-2">
        {providers.map((p) => {
          const icono = ICONO[p.tipo] ?? ICONO.OIDC_GENERIC;
          const cargando = pendingId === p.id;
          return (
            <button
              key={p.id}
              type="button"
              disabled={pendingId !== null}
              onClick={() => {
                setPendingId(p.id);
                startTransition(() => {
                  signIn(p.id, { callbackUrl: "/" });
                });
              }}
              className="group flex w-full cursor-pointer items-center justify-center gap-3 rounded-lg border border-brand-border bg-brand-paper px-4 py-2.5 text-sm font-medium text-brand-ink transition-colors duration-150 ease-out hover:border-brand-navy/40 hover:bg-brand-cream-deep/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cargando ? <Loader2 aria-hidden className="size-4 animate-spin" /> : icono}
              <span>Continuar con {p.nombre}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
