import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import type { Provider } from "next-auth/providers";
import { authorize } from "./authorize";
import { registrarAudit } from "./audit";
import { prisma } from "./db";
import { descifrar } from "./crypto";

type NextAuthProfile = {
  sub?: string;
  email?: string;
  name?: string;
  preferred_username?: string;
};

/**
 * Construye la lista de providers leyendo la DB cada request.
 * Credentials siempre está disponible (fallback garantizado). Providers
 * SSO se agregan según `AuthProvider.habilitado=true`.
 *
 * Nota: si agregar el provider lanza (secret corrupto, issuer unreachable
 * en init), lo saltamos para no romper el login entero.
 */
async function cargarProviders(): Promise<Provider[]> {
  const providers: Provider[] = [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      authorize,
    }),
  ];

  try {
    const dbProviders = await prisma.authProvider.findMany({
      where: { habilitado: true },
      orderBy: [{ orden: "asc" }, { nombre: "asc" }],
    });

    for (const p of dbProviders) {
      let secret: string;
      try {
        secret = descifrar(p.clientSecretEnc);
      } catch {
        continue; // secret corrupto, saltar sin romper
      }

      if (p.tipo === "GOOGLE") {
        providers.push(
          Google({
            id: p.id,
            name: p.nombre,
            clientId: p.clientId,
            clientSecret: secret,
            authorization: p.hostedDomain
              ? { params: { hd: p.hostedDomain, scope: "openid email profile" } }
              : undefined,
          }),
        );
      } else if (p.tipo === "AZURE_AD" && p.tenantId) {
        providers.push({
          id: p.id,
          name: p.nombre,
          type: "oidc",
          clientId: p.clientId,
          clientSecret: secret,
          issuer: `https://login.microsoftonline.com/${p.tenantId}/v2.0`,
          authorization: { params: { scope: "openid email profile" } },
        });
      } else if (
        (p.tipo === "OIDC_GENERIC" || p.tipo === "KEYCLOAK") &&
        p.issuer
      ) {
        providers.push({
          id: p.id,
          name: p.nombre,
          type: "oidc",
          clientId: p.clientId,
          clientSecret: secret,
          issuer: p.issuer,
          authorization: { params: { scope: "openid email profile" } },
        });
      }
    }
  } catch (e) {
    // DB inaccesible en build-time o desconfigurada — solo Credentials
    console.warn("[auth] no se pudieron cargar providers dinámicos:", e);
  }

  return providers;
}

export const { handlers, auth, signIn, signOut } = NextAuth(async () => {
  const providers = await cargarProviders();
  return {
    providers,
    pages: { signIn: "/login" },
    // Session de 24h — corta ventanas de session hijack; el refresh extiende
    // mientras el usuario esté activo. Antes: 30 días (default NextAuth).
    session: { strategy: "jwt", maxAge: 24 * 60 * 60, updateAge: 60 * 60 },
    events: {
      async signIn({ user }) {
        if (user?.id) {
          await registrarAudit({
            userId: user.id,
            accion: "login.success",
            targetId: user.id,
          });
        }
      },
      async signOut(msg) {
        const userId =
          "token" in msg ? (msg.token?.id as string | undefined) : undefined;
        if (userId) {
          await registrarAudit({ userId, accion: "logout", targetId: userId });
        }
      },
    },
    callbacks: {
      /**
       * Para logins OAuth/OIDC: si el usuario no existe, lo creamos con el
       * rol default configurado en el AuthProvider correspondiente.
       * Credentials no pasa por aquí (la validación está en authorize).
       */
      async signIn({ user, account, profile }) {
        if (!account || account.provider === "credentials") return true;

        const email = user.email ?? (profile as NextAuthProfile)?.email;
        if (!email) return false;

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
          // Actualizar nombre si venía vacío
          if (!existing.nombre && (profile as NextAuthProfile)?.name) {
            await prisma.user.update({
              where: { id: existing.id },
              data: {
                nombre: (profile as NextAuthProfile).name!,
                activado: true,
              },
            });
          }
          user.id = existing.id;
          (user as { rol?: string }).rol = existing.rol;
          (user as { nombre?: string }).nombre = existing.nombre || email;
          return true;
        }

        // Primer login — encontrar el provider DB para decidir rol default
        const dbProvider = await prisma.authProvider.findUnique({
          where: { id: account.provider },
        });
        const rolDefault =
          (dbProvider?.rolDefault as "ADMIN" | "REVIEWER" | "VOTANTE") ??
          "VOTANTE";

        const nuevo = await prisma.user.create({
          data: {
            email,
            nombre: (profile as NextAuthProfile)?.name ?? email,
            rol: rolDefault,
            activado: true,
            hashedPassword: null,
            creadoPor: null,
          },
        });
        user.id = nuevo.id;
        (user as { rol?: string }).rol = nuevo.rol;
        (user as { nombre?: string }).nombre = nuevo.nombre;
        await registrarAudit({
          userId: nuevo.id,
          accion: "usuario.crear",
          targetId: nuevo.id,
          metadata: {
            email,
            rol: nuevo.rol,
            via: "SSO",
            providerId: account.provider,
          },
        });
        return true;
      },
      async jwt({ token, user }) {
        if (user) {
          token.id = user.id;
          token.rol = (user as { rol?: string }).rol ?? "VOTANTE";
          token.nombre =
            (user as { nombre?: string }).nombre ?? user.email ?? "";
        }
        return token;
      },
      async session({ session, token }) {
        if (session.user) {
          session.user.id = token.id as string;
          session.user.rol = token.rol as "ADMIN" | "REVIEWER" | "VOTANTE";
          session.user.nombre = token.nombre as string;
        }
        return session;
      },
    },
  };
});
