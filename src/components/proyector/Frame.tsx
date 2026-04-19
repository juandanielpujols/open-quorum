import { BrandWordmark } from "@/components/brand-mark";

export function ProjectorFrame({
  nombre,
  children,
}: {
  nombre: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-brand-cream">
      {/* Pattern sutil: gradient radial apagado + bordes color */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 50% 0%, var(--brand-paper) 0%, transparent 60%), radial-gradient(ellipse at 100% 100%, color-mix(in srgb, var(--brand-navy) 6%, transparent) 0%, transparent 55%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-0 right-0 top-0 h-1 bg-brand-crimson"
      />

      <header className="relative z-10 flex items-center justify-between border-b border-brand-border/60 bg-brand-paper/70 px-12 py-6 backdrop-blur">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-brand-ink">
          {nombre}
        </h1>
        <BrandWordmark className="text-xl text-brand-ink" />
      </header>

      <main className="relative z-10 flex min-h-[calc(100vh-5rem)] items-center justify-center px-12 py-16">
        {children}
      </main>
    </div>
  );
}
