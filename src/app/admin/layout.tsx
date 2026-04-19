import Link from "next/link";
import { auth, signOut } from "@/lib/auth";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Votaciones";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <div className="min-h-screen">
      <header className="bg-sb-azul text-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-semibold">{APP_NAME} · Admin</span>
          <nav className="flex gap-4 text-sm">
            <Link href="/admin/eventos">Eventos</Link>
            <Link href="/admin/usuarios">Usuarios</Link>
            <Link href="/admin/tags">Tags</Link>
          </nav>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button className="text-sm opacity-80 hover:opacity-100">
            {session?.user.nombre} · Salir
          </button>
        </form>
      </header>
      <main>{children}</main>
    </div>
  );
}
