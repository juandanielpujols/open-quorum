/**
 * Marca visual de Open Quorum (domain-agnostic — cada despliegue puede
 * reemplazar con un logo propio vía AppBranding.logoUrl).
 *
 * Implementación en HTML+CSS (no SVG) para garantizar que la fuente
 * Crimson Pro cargada por next/font se aplique correctamente. El color
 * viene del `text-*` pasado en className; la tipografía y espaciado
 * escalan con `font-size`.
 */

export function BrandWordmark({ className = "" }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="Open Quorum"
      className={`inline-flex items-baseline gap-[0.28em] font-display leading-none tracking-tight ${className}`}
    >
      <span aria-hidden className="font-medium italic">
        open
      </span>
      <span
        aria-hidden
        className="inline-block h-[0.2em] w-[0.2em] -translate-y-[0.18em] rounded-full bg-brand-crimson"
      />
      <span aria-hidden className="font-semibold">
        quorum
      </span>
    </span>
  );
}

export function BrandMonogram({ className = "" }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="Open Quorum"
      className={`inline-flex items-baseline font-display font-semibold leading-none tracking-tight ${className}`}
    >
      <span aria-hidden>OQ</span>
      <span
        aria-hidden
        className="ml-[0.1em] inline-block h-[0.18em] w-[0.18em] -translate-y-[0.16em] rounded-full bg-brand-crimson"
      />
    </span>
  );
}
