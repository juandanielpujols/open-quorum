import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkRateLimit, getClientIp, LIMITS } from "@/lib/rate-limit";

const RUTAS_ADMIN = ["/admin"];
const RUTAS_REVIEWER = ["/reviewer"];
const RUTAS_VOTANTE = ["/votante"];
const RUTAS_PROYECTAR = ["/proyectar"];

/**
 * Cabeceras de seguridad aplicadas a todas las respuestas.
 * CSP intenta ser restrictivo pero permite unsafe-inline en style porque
 * Tailwind 4 runtime + next/font generan estilos inline. Los scripts son
 * self-only + hashes de Next. Revisar si se agregan SDKs de terceros.
 */
const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY", // proyector tampoco se embebe en iframes externos
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  "X-DNS-Prefetch-Control": "off",
  // CSP pragmático — pasible de endurecer con nonces si se quiere eliminar unsafe-inline
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; "),
};

function aplicarHeadersSeguridad(res: NextResponse): NextResponse {
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
    res.headers.set(k, v);
  }
  return res;
}

function respuesta429(retryAfterMs: number | undefined): NextResponse {
  const res = NextResponse.json(
    { error: "Demasiados intentos. Intenta de nuevo en unos segundos." },
    { status: 429 },
  );
  if (retryAfterMs) {
    res.headers.set("Retry-After", String(Math.ceil(retryAfterMs / 1000)));
  }
  return aplicarHeadersSeguridad(res);
}

export default async function proxy(req: Parameters<Parameters<typeof auth>[0]>[0]) {
  const { pathname } = req.nextUrl;
  const session = (await auth()) ?? null;
  const ip = getClientIp(req.headers);

  // Rate-limit por IP en endpoints sensibles (anónimos, no requieren sesión)
  if (req.method === "POST") {
    if (pathname === "/api/auth/callback/credentials") {
      const rl = checkRateLimit(`login:${ip}`, LIMITS.LOGIN.max, LIMITS.LOGIN.windowMs);
      if (!rl.ok) return respuesta429(rl.retryAfterMs);
    }
    if (pathname === "/api/activar") {
      const rl = checkRateLimit(
        `activate:${ip}`,
        LIMITS.ACTIVACION.max,
        LIMITS.ACTIVACION.windowMs,
      );
      if (!rl.ok) return respuesta429(rl.retryAfterMs);
    }
  }

  // Rutas públicas — headers de seguridad pero sin redirect
  if (
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/activar") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/activar") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return aplicarHeadersSeguridad(NextResponse.next());
  }

  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    // Whitelisting: solo guardamos el next si es una ruta relativa propia
    if (pathname.startsWith("/") && !pathname.startsWith("//")) {
      url.searchParams.set("next", pathname);
    }
    return aplicarHeadersSeguridad(NextResponse.redirect(url));
  }

  const rol = session.user.rol;
  const enAdmin = RUTAS_ADMIN.some((p) => pathname.startsWith(p));
  const enReviewer = RUTAS_REVIEWER.some((p) => pathname.startsWith(p));
  const enVotante = RUTAS_VOTANTE.some((p) => pathname.startsWith(p));
  const enProyectar = RUTAS_PROYECTAR.some((p) => pathname.startsWith(p));

  if (enAdmin && rol !== "ADMIN")
    return aplicarHeadersSeguridad(NextResponse.redirect(new URL("/", req.url)));
  if (enReviewer && rol !== "REVIEWER")
    return aplicarHeadersSeguridad(NextResponse.redirect(new URL("/", req.url)));
  if (enVotante && rol !== "VOTANTE")
    return aplicarHeadersSeguridad(NextResponse.redirect(new URL("/", req.url)));
  if (enProyectar && rol !== "ADMIN")
    return aplicarHeadersSeguridad(NextResponse.redirect(new URL("/", req.url)));

  return aplicarHeadersSeguridad(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
