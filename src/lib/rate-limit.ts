/**
 * Token-bucket in-memory por clave.
 *
 * Mitigación: brute force de login, spam de activación, abuso de votos.
 * Residual risk: no funciona con múltiples instancias — para prod con ≥2 replicas
 * reemplazar el Map por Redis (`@upstash/ratelimit` o similar).
 */

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function checkRateLimit(
  key: string,
  max: number,
  windowMs: number,
): { ok: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (b.count >= max) return { ok: false, retryAfterMs: b.resetAt - now };
  b.count++;
  return { ok: true };
}

/** Extrae IP del cliente respetando proxies reversos comunes. */
export function getClientIp(headers: Headers): string {
  // X-Forwarded-For puede ser lista "client, proxy1, proxy2"; el primero es el origen
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  const cfIp = headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();
  return "unknown";
}

/** Presets — centralizar aquí para evitar valores mágicos dispersos. */
export const LIMITS = {
  /** Login: 10 intentos / min / IP — tolera typeo humano, corta brute force */
  LOGIN: { max: 10, windowMs: 60_000 },
  /** Activación: 10 intentos / min / IP — token es aleatorio, no brute forceable, pero cortamos spam */
  ACTIVACION: { max: 10, windowMs: 60_000 },
  /** Voto: 30 / min / usuario — un votante no vota 30 veces por minuto legítimamente */
  VOTO: { max: 30, windowMs: 60_000 },
  /** SSE: max 10 conexiones concurrentes por IP (TCP exhaust mitigation) */
  SSE_CONCURRENT: { max: 10 },
} as const;
