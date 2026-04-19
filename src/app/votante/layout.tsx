import { auth, signOut } from "@/lib/auth";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Votaciones";

export default async function VotanteLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <div className="min-h-screen">
      <header className="bg-sb-azul text-white px-6 py-3 flex items-center justify-between">
        <span className="font-semibold">{APP_NAME}</span>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button className="text-sm">{session?.user.nombre} · Salir</button>
        </form>
      </header>
      <main>{children}</main>
    </div>
  );
}
