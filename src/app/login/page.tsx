import { Suspense } from "react";
import { BrandWordmark, BrandMonogram } from "@/components/brand-mark";
import { LoginForm } from "./login-form";
import { ProvidersSlot } from "./providers-slot";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Open Quorum";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-brand-cream text-brand-body lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <aside className="brand-grain relative hidden overflow-hidden bg-brand-navy-deep text-brand-cream lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div aria-hidden className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-navy/40 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-40 -left-20 h-80 w-80 rounded-full bg-brand-crimson/20 blur-3xl" />

        <header className="relative cgr-reveal">
          <BrandWordmark className="text-[2.25rem] text-brand-cream" />
          <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.3em] text-brand-cream/70">
            Sistema de votaciones open-source
          </p>
        </header>

        <div className="relative cgr-reveal" style={{ animationDelay: "120ms" }}>
          <div className="mb-6 h-px w-16 bg-brand-crimson" />
          <h1 className="font-display text-5xl leading-[1.1] tracking-tight text-brand-cream">
            Decisiones con
            <br />
            <span className="italic">trazabilidad.</span>
          </h1>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-brand-cream/75">
            Plataforma de votación para consejos, juntas directivas y asambleas.
            Resultados en vivo, proyección en sala, auditoría de cada decisión.
          </p>
        </div>

        <footer className="relative flex items-center justify-between text-[11px] text-brand-cream/65 cgr-reveal" style={{ animationDelay: "240ms" }}>
          <span className="uppercase tracking-[0.18em]">{APP_NAME}</span>
          <span>© {new Date().getFullYear()}</span>
        </footer>
      </aside>

      <main className="flex min-h-screen items-center justify-center px-6 py-12 lg:min-h-0 lg:px-12 lg:py-16">
        <div className="w-full max-w-sm cgr-reveal">
          <div className="mb-10 flex flex-col items-center lg:hidden">
            <BrandMonogram className="text-5xl text-brand-ink" />
            <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.24em] text-brand-muted">
              {APP_NAME}
            </p>
          </div>

          <div className="mb-7">
            <h2 className="font-display text-[2.5rem] leading-tight font-semibold tracking-tight text-brand-ink">
              Bienvenido
            </h2>
            <p className="mt-2 text-sm text-brand-muted">
              Ingresa con tu correo institucional.
            </p>
          </div>

          <div className="space-y-6">
            <Suspense
              fallback={
                <div aria-hidden className="space-y-5">
                  <div className="h-[60px] rounded-lg bg-brand-cream-deep/60" />
                  <div className="h-[60px] rounded-lg bg-brand-cream-deep/60" />
                  <div className="h-[54px] rounded-lg bg-brand-cream-deep/60" />
                </div>
              }
            >
              <LoginForm />
            </Suspense>

            <ProvidersSlot />
          </div>
        </div>
      </main>
    </div>
  );
}
