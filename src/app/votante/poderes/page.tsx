import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  otorgarPoder,
  revocarPoder,
  listarPoderesOtorgados,
  listarPoderesRecibidos,
} from "@/server/poderes";
import { revalidatePath } from "next/cache";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Shield, UserCheck, UserX, Users } from "lucide-react";

export const dynamic = "force-dynamic";

const fieldCls =
  "h-10 w-full rounded-md border border-brand-border bg-brand-paper px-3 text-sm text-brand-ink focus-visible:border-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/15";
const labelCls =
  "text-[11px] font-bold uppercase tracking-[0.12em] text-brand-muted";

export default async function PoderesPage() {
  const session = await auth();
  if (!session || session.user.rol !== "VOTANTE") redirect("/");

  const [otorgados, recibidos, candidatos, eventosInvitados] = await Promise.all([
    listarPoderesOtorgados(session.user.id),
    listarPoderesRecibidos(session.user.id),
    prisma.user.findMany({
      where: {
        rol: "VOTANTE",
        activado: true,
        id: { not: session.user.id },
      },
      select: { id: true, nombre: true, email: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.eventoInvitacion.findMany({
      where: {
        userId: session.user.id,
        evento: { estado: { in: ["BORRADOR", "ACTIVO"] } },
      },
      include: { evento: { select: { id: true, nombre: true, estado: true } } },
    }),
  ]);

  async function onOtorgar(fd: FormData) {
    "use server";
    const s = await auth();
    if (!s || s.user.rol !== "VOTANTE") throw new Error("forbidden");
    const proxyId = String(fd.get("proxyId"));
    const eventoId = String(fd.get("eventoId") || "");
    if (!proxyId) throw new Error("Selecciona un representante");
    await otorgarPoder({
      grantorId: s.user.id,
      proxyId,
      eventoId: eventoId || null,
    });
    revalidatePath("/votante/poderes");
  }

  async function onRevocar(fd: FormData) {
    "use server";
    const s = await auth();
    if (!s) throw new Error("forbidden");
    await revocarPoder(String(fd.get("poderId")), s.user.id);
    revalidatePath("/votante/poderes");
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 lg:px-8 lg:py-10">
      <header className="mb-8">
        <h1 className="flex items-center gap-2 font-display text-3xl font-semibold tracking-tight text-brand-ink">
          <Shield aria-hidden className="size-7 text-brand-navy" />
          Mis poderes
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-brand-muted">
          Un poder permite que otro votante vote en tu nombre. Tu voto directo
          siempre prevalece si decides votar personalmente.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* OTORGAR */}
        <Card className="border-brand-border bg-brand-paper shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-lg font-semibold text-brand-ink">
              <UserCheck aria-hidden className="size-5 text-brand-navy" />
              Otorgar poder
            </CardTitle>
            <CardDescription className="text-xs text-brand-muted">
              Elige a quién representa tu voto. Podrás revocar en cualquier momento.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={onOtorgar} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="proxyId" className={labelCls}>Representante</Label>
                <select id="proxyId" name="proxyId" required className={fieldCls}>
                  <option value="">Selecciona un votante…</option>
                  {candidatos.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombre} — {u.email}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="eventoId" className={labelCls}>Alcance</Label>
                <select id="eventoId" name="eventoId" className={fieldCls}>
                  <option value="">Global (todos los eventos en que participe)</option>
                  {eventosInvitados.map((i) => (
                    <option key={i.evento.id} value={i.evento.id}>
                      Solo: {i.evento.nombre} ({i.evento.estado})
                    </option>
                  ))}
                </select>
              </div>
              <Button
                type="submit"
                className="w-full bg-brand-navy text-white hover:bg-brand-navy-deep"
              >
                Otorgar poder
              </Button>
            </form>

            <div className="mt-6 border-t border-brand-border pt-4">
              <h3 className="text-sm font-semibold text-brand-ink">Mis poderes otorgados</h3>
              {otorgados.length === 0 ? (
                <p className="mt-2 text-xs text-brand-muted">Aún no has otorgado poderes.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {otorgados.map((p) => (
                    <li key={p.id} className="flex items-start justify-between gap-2 rounded-md bg-brand-cream/50 px-3 py-2 text-sm">
                      <div>
                        <p className="font-medium text-brand-ink">{p.proxy.nombre}</p>
                        <p className="text-[11px] text-brand-muted">
                          {p.evento ? `Evento: ${p.evento.nombre}` : "Alcance global"}
                          {" · otorgado "}
                          {p.otorgadoAt.toLocaleDateString("es-DO")}
                        </p>
                      </div>
                      <form action={onRevocar}>
                        <input type="hidden" name="poderId" value={p.id} />
                        <Button
                          type="submit"
                          size="sm"
                          variant="ghost"
                          className="gap-1 text-brand-crimson hover:bg-brand-crimson/10"
                        >
                          <UserX aria-hidden className="size-3.5" />
                          Revocar
                        </Button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>

        {/* RECIBIDOS */}
        <Card className="border-brand-border bg-brand-paper shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-lg font-semibold text-brand-ink">
              <Users aria-hidden className="size-5 text-brand-navy" />
              Poderes recibidos
            </CardTitle>
            <CardDescription className="text-xs text-brand-muted">
              Cuando votes, tu voto también cuenta automáticamente por estas personas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recibidos.length === 0 ? (
              <p className="text-xs text-brand-muted">
                Nadie te ha otorgado un poder aún.
              </p>
            ) : (
              <ul className="space-y-2">
                {recibidos.map((p) => (
                  <li key={p.id} className="rounded-md bg-brand-cream/50 px-3 py-2 text-sm">
                    <p className="font-medium text-brand-ink">{p.grantor.nombre}</p>
                    <p className="text-[11px] text-brand-muted">
                      {p.grantor.email}
                      {" · "}
                      {p.evento ? `Evento: ${p.evento.nombre}` : "Alcance global"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-4 rounded-md bg-brand-cream px-3 py-2 text-[11px] leading-relaxed text-brand-muted">
              <strong>Nota:</strong> si el grantor vota directamente, su voto
              directo reemplaza el que hayas emitido por él. Tu voto propio
              sigue contando.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
