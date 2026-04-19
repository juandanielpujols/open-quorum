import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authorize } from "./authorize";
import { registrarAudit } from "./audit";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      authorize,
    }),
  ],
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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.rol = (user as { rol: string }).rol;
        token.nombre = (user as { nombre: string }).nombre;
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
});
