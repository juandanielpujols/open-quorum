"use client";
import { useState } from "react";
import type { Opcion } from "@/generated/prisma";

type Props = { opciones: Opcion[]; onSubmit: (opcionIds: string[]) => Promise<void> };

export function VoterSiNo({ opciones, onSubmit }: Props) {
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const sí = opciones.find((o) => /^s[íi]$/i.test(o.texto));
  const no = opciones.find((o) => /^no$/i.test(o.texto));

  async function vota(opcionId: string) {
    setSending(true);
    await onSubmit([opcionId]);
    setSending(false);
    setDone(true);
  }

  if (done)
    return <p className="text-center py-8 text-sb-verde">✓ Tu voto fue registrado</p>;

  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        disabled={sending || !sí}
        onClick={() => vota(sí!.id)}
        className="bg-sb-verde text-white rounded-xl p-6 text-xl font-semibold disabled:opacity-50"
      >
        Sí
      </button>
      <button
        disabled={sending || !no}
        onClick={() => vota(no!.id)}
        className="bg-sb-terracota text-white rounded-xl p-6 text-xl font-semibold disabled:opacity-50"
      >
        No
      </button>
    </div>
  );
}
