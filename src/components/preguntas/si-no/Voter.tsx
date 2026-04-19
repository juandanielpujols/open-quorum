"use client";
import { useState } from "react";
import type { Opcion } from "@/generated/prisma";
import { Check, X } from "lucide-react";

type Props = { opciones: Opcion[]; onSubmit: (opcionIds: string[]) => Promise<void> };

export function VoterSiNo({ opciones, onSubmit }: Props) {
  const [sending, setSending] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const sí = opciones.find((o) => /^s[íi]$/i.test(o.texto));
  const no = opciones.find((o) => /^no$/i.test(o.texto));

  async function vota(opcionId: string) {
    setSending(opcionId);
    await onSubmit([opcionId]);
    setSending(null);
    setDone(true);
  }

  if (done)
    return (
      <p className="flex items-center justify-center gap-2 rounded-lg bg-brand-success/10 py-6 text-center font-medium text-brand-success-deep">
        <Check aria-hidden className="size-5" />
        Tu voto fue registrado
      </p>
    );

  return (
    <div className="grid grid-cols-2 gap-4">
      <button
        type="button"
        disabled={sending !== null || !sí}
        onClick={() => vota(sí!.id)}
        className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-brand-success p-8 text-2xl font-bold text-white shadow-sm transition-all hover:bg-brand-success-deep active:scale-[0.98] disabled:opacity-50"
      >
        <Check aria-hidden className="size-10" strokeWidth={2.5} />
        Sí
      </button>
      <button
        type="button"
        disabled={sending !== null || !no}
        onClick={() => vota(no!.id)}
        className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-brand-danger p-8 text-2xl font-bold text-white shadow-sm transition-all hover:bg-brand-danger-deep active:scale-[0.98] disabled:opacity-50"
      >
        <X aria-hidden className="size-10" strokeWidth={2.5} />
        No
      </button>
    </div>
  );
}
