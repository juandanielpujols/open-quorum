"use client";
import { useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const fieldBase =
  "h-12 w-full rounded-lg border-brand-border bg-brand-paper px-4 text-[15px] text-brand-ink placeholder:text-brand-muted/70 shadow-none transition-[border-color,box-shadow] duration-200 ease-out focus-visible:border-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/15";

const labelBase =
  "block text-[11px] font-bold uppercase tracking-[0.14em] text-brand-muted";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const activada = params.get("activada") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!activada) emailRef.current?.focus();
  }, [activada]);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !loading;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) return setError("Credenciales inválidas.");
    router.push("/");
  }

  function detectCaps(e: React.KeyboardEvent<HTMLInputElement>) {
    setCapsOn(e.getModifierState("CapsLock"));
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {activada && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-start gap-3 rounded-lg border border-emerald-200/70 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-900"
        >
          <CheckCircle2 aria-hidden className="mt-0.5 size-4 shrink-0 text-emerald-600" />
          <span>Cuenta activada correctamente. Ya puedes iniciar sesión.</span>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="email" className={labelBase}>Correo electrónico</Label>
        <Input
          ref={emailRef}
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          spellCheck={false}
          required
          placeholder="nombre@organizacion.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={error ? true : undefined}
          className={fieldBase}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password" className={labelBase}>Contraseña</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={detectCaps}
            onKeyUp={detectCaps}
            onBlur={() => setCapsOn(false)}
            aria-invalid={error ? true : undefined}
            className={cn(fieldBase, "pr-11")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-pressed={showPassword}
            className="absolute right-1.5 top-1/2 inline-flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-brand-muted transition-colors duration-150 ease-out hover:text-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/30"
          >
            {showPassword ? <EyeOff aria-hidden className="size-4" /> : <Eye aria-hidden className="size-4" />}
          </button>
        </div>
        {capsOn && (
          <p role="status" aria-live="polite" className="flex items-center gap-1.5 text-xs text-amber-800">
            <AlertCircle aria-hidden className="size-3.5" />
            Bloq Mayús está activado.
          </p>
        )}
      </div>

      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="flex items-start gap-2 rounded-md border border-brand-crimson/20 bg-brand-crimson/5 px-3 py-2.5 text-sm text-brand-crimson"
        >
          <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="group relative block w-full cursor-pointer overflow-hidden rounded-lg bg-brand-navy px-4 py-3.5 text-[15px] font-bold tracking-wide text-white transition-colors duration-200 ease-out hover:bg-brand-navy-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-crimson/50 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-cream disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-brand-navy"
      >
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-[3px] bg-brand-crimson opacity-80 transition-opacity duration-200 ease-out group-hover:opacity-100 group-disabled:opacity-40"
        />
        <span className="inline-flex items-center justify-center gap-2">
          {loading && <Loader2 aria-hidden className="size-4 animate-spin" />}
          {loading ? "Ingresando…" : "Ingresar"}
        </span>
      </button>

      <p className="text-center text-xs leading-relaxed text-brand-muted">
        ¿Problemas para acceder? Contacta al administrador de tu organización.
      </p>
    </form>
  );
}
