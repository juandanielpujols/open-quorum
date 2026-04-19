import type { Rol } from "@/generated/prisma";

declare module "next-auth" {
  interface User {
    id: string;
    rol: Rol;
    nombre: string;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      nombre: string;
      rol: Rol;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    rol?: Rol;
    nombre?: string;
  }
}
