import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EventosVotante() {
  const session = await auth();
  if (!session) redirect("/login");
  const invitaciones = await prisma.eventoInvitacion.findMany({
    where: { userId: session.user.id },
    include: { evento: true },
  });
  const activos = invitaciones.filter((i) => i.evento.estado === "ACTIVO");
  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-4">Mis votaciones</h1>
      {activos.length === 0 && (
        <p className="text-sb-gris">No tienes votaciones activas.</p>
      )}
      <ul className="space-y-2">
        {activos.map((i) => (
          <li key={i.eventoId}>
            <Link
              href={`/votante/votar/${i.eventoId}`}
              className="block bg-white rounded-xl border border-gray-100 p-4 hover:bg-brand-cream"
            >
              <p className="font-medium text-sb-azul">{i.evento.nombre}</p>
              <p className="text-xs text-sb-gris">{i.evento.modo}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
