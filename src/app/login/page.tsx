"use client";
import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Votaciones";

function Monogram({ className = "" }: { className?: string }) {
  // Monograma institucional inspirado en el logo del club: letras serif C · G · R
  // con triángulo crimson apuntando hacia arriba (como flecha del logo original).
  return (
    <svg
      viewBox="0 0 160 64"
      className={className}
      role="img"
      aria-label="Monograma CGR"
    >
      <text
        x="0"
        y="50"
        fontFamily='"Crimson Pro", Georgia, serif'
        fontWeight="600"
        fontSize="56"
        letterSpacing="-2"
        fill="currentColor"
      >
        C
      </text>
      <polygon
        points="72,40 88,20 88,48"
        fill="#C62828"
      />
      <text
        x="96"
        y="50"
        fontFamily='"Crimson Pro", Georgia, serif'
        fontWeight="600"
        fontSize="56"
        letterSpacing="-2"
        fill="currentColor"
      >
        R
      </text>
    </svg>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) return setError("Credenciales inválidas.");
    router.push("/");
  }

  const activada = params.get("activada") === "1";

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {activada && (
        <div
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-800"
        >
          Cuenta activada correctamente. Ya puedes iniciar sesión.
        </div>
      )}

      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="block text-[11px] font-bold uppercase tracking-[0.14em] text-brand-muted"
        >
          Correo electrónico
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="nombre@organizacion.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-brand-border bg-brand-paper px-4 py-3 text-[15px] text-brand-ink placeholder:text-brand-muted/70 transition-colors duration-200 focus:border-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-navy/20"
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="password"
          className="block text-[11px] font-bold uppercase tracking-[0.14em] text-brand-muted"
        >
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-brand-border bg-brand-paper px-4 py-3 text-[15px] text-brand-ink placeholder:text-brand-muted/70 transition-colors duration-200 focus:border-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-navy/20"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-brand-crimson">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="group relative w-full cursor-pointer overflow-hidden rounded-lg bg-brand-navy px-4 py-3.5 text-[15px] font-bold tracking-wide text-white transition-all duration-200 hover:bg-brand-navyDeep focus:outline-none focus:ring-2 focus:ring-brand-crimson/40 focus:ring-offset-2 focus:ring-offset-brand-cream disabled:opacity-60"
      >
        <span className="relative z-10">
          {loading ? "Ingresando..." : "Ingresar"}
        </span>
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-1 bg-brand-crimson transition-all duration-300 group-hover:w-full group-hover:opacity-0"
        />
      </button>

      <p className="text-center text-xs text-brand-muted">
        ¿Problemas para acceder? Contacta al administrador de tu organización.
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-brand-cream text-brand-body lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      {/* Panel izquierdo — institucional, solo desktop */}
      <aside className="relative hidden overflow-hidden bg-brand-navyDeep text-brand-cream lg:flex lg:flex-col lg:justify-between lg:p-12 brand-grain">
        <div
          aria-hidden
          className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-navy/40 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-40 -left-20 h-80 w-80 rounded-full bg-brand-crimson/20 blur-3xl"
        />

        <header className="relative cgr-reveal">
          <Monogram className="h-14 w-auto text-brand-cream" />
          <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.3em] text-brand-cream/70">
            Sistema de Votaciones
          </p>
        </header>

        <div className="relative cgr-reveal" style={{ animationDelay: "120ms" }}>
          <div className="mb-6 h-px w-16 bg-brand-crimson" />
          <h1 className="font-display text-5xl leading-tight tracking-tight text-brand-cream">
            Decisiones con
            <br />
            <span className="italic text-brand-cream/90">trazabilidad.</span>
          </h1>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-brand-cream/70">
            Plataforma de votación para consejos, juntas directivas y asambleas.
            Resultados en vivo, proyección en sala, auditoría de cada decisión.
          </p>
        </div>

        <footer
          className="relative flex items-center justify-between text-[11px] text-brand-cream/50 cgr-reveal"
          style={{ animationDelay: "240ms" }}
        >
          <span className="uppercase tracking-[0.18em]">{APP_NAME}</span>
          <span>© {new Date().getFullYear()}</span>
        </footer>
      </aside>

      {/* Panel derecho — formulario */}
      <main className="flex min-h-screen items-center justify-center px-6 py-16 lg:min-h-0 lg:px-12">
        <div className="w-full max-w-sm cgr-reveal">
          {/* Monograma para mobile */}
          <div className="mb-10 flex flex-col items-center lg:hidden">
            <Monogram className="h-10 w-auto text-brand-navyDeep" />
            <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.24em] text-brand-muted">
              {APP_NAME}
            </p>
          </div>

          <div className="mb-8">
            <h2 className="font-display text-4xl font-semibold tracking-tight text-brand-ink">
              Bienvenido
            </h2>
            <p className="mt-2 text-sm text-brand-muted">
              Ingresa tus credenciales para acceder.
            </p>
          </div>

          <Suspense
            fallback={
              <p className="text-sm text-brand-muted">Cargando…</p>
            }
          >
            <LoginForm />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
