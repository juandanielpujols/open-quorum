import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const RUTAS_ADMIN = ["/admin", "/usuarios", "/tags"];
const RUTAS_REVIEWER = ["/reviewer"];
const RUTAS_VOTANTE = ["/votante", "/votar"];
const RUTAS_PROYECTAR = ["/proyectar"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  if (
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/activar") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/activar") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const rol = session.user.rol;

  const enAdmin =
    RUTAS_ADMIN.some((p) => pathname.startsWith(p)) ||
    (pathname.startsWith("/eventos") && rol === "ADMIN");
  const enReviewer = RUTAS_REVIEWER.some((p) => pathname.startsWith(p));
  const enVotante = RUTAS_VOTANTE.some((p) => pathname.startsWith(p));
  const enProyectar = RUTAS_PROYECTAR.some((p) => pathname.startsWith(p));

  if (enAdmin && rol !== "ADMIN") return NextResponse.redirect(new URL("/", req.url));
  if (enReviewer && rol !== "REVIEWER") return NextResponse.redirect(new URL("/", req.url));
  if (enVotante && rol !== "VOTANTE") return NextResponse.redirect(new URL("/", req.url));
  if (enProyectar && rol !== "ADMIN") return NextResponse.redirect(new URL("/", req.url));

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
