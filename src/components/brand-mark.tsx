/**
 * Marca visual de Open Quorum (sin hardcodear el cliente consumidor).
 * - BrandWordmark: versión extendida para hero (login)
 * - BrandMonogram: versión compacta para sidebar / favicon-like
 *
 * Cuando `AppBranding.logoUrl` está configurado por un despliegue,
 * AppShell usa <img> en su lugar y este monograma solo aparece como
 * fallback o decoración.
 */

export function BrandWordmark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 260 48"
      className={className}
      role="img"
      aria-label="Open Quorum"
    >
      <text
        x="0"
        y="36"
        fontFamily='"Crimson Pro", Georgia, serif'
        fontWeight="500"
        fontStyle="italic"
        fontSize="38"
        letterSpacing="-1"
        fill="currentColor"
      >
        open
      </text>
      <circle cx="96" cy="33" r="3" fill="var(--brand-crimson)" />
      <text
        x="108"
        y="36"
        fontFamily='"Crimson Pro", Georgia, serif'
        fontWeight="600"
        fontSize="38"
        letterSpacing="-1.5"
        fill="currentColor"
      >
        quorum
      </text>
    </svg>
  );
}

export function BrandMonogram({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 48"
      className={className}
      role="img"
      aria-label="Open Quorum"
    >
      <text
        x="0"
        y="38"
        fontFamily='"Crimson Pro", Georgia, serif'
        fontWeight="600"
        fontSize="44"
        letterSpacing="-2"
        fill="currentColor"
      >
        OQ
      </text>
      <circle cx="68" cy="38" r="3.5" fill="var(--brand-crimson)" />
    </svg>
  );
}
