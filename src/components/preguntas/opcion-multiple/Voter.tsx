"use client";
import { useState } from "react";
import type { Opcion } from "@/generated/prisma";
import type { ConfigOpcionMultiple } from "./Schema";
import { Check } from "lucide-react";

type Props = {
  preguntaId: string;
  config: ConfigOpcionMultiple;
  opciones: Opcion[];
  onSubmit: (opcionIds: string[]) => Promise<void>;
};

export function VoterOpcionMultiple({ config, opciones, onSubmit }: Props) {
  const [sel, setSel] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  function toggle(id: string) {
    if (!config.permitirMultiple) return setSel([id]);
    setSel((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id].slice(0, config.maxSelecciones),
    );
  }

  async function submit() {
    if (!sel.length) return;
    setSending(true);
    await onSubmit(sel);
    setSending(false);
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
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {opciones.map((op) => {
          const active = sel.includes(op.id);
          return (
            <button
              key={op.id}
              type="button"
              onClick={() => toggle(op.id)}
              className={`rounded-xl border-2 p-4 text-left transition-all active:scale-[0.99] ${
                active
                  ? "border-brand-navy bg-brand-navy/5 ring-2 ring-brand-navy/15"
                  : "border-brand-border bg-brand-paper hover:border-brand-navy/40 hover:bg-brand-cream"
              }`}
            >
              {op.imagenUrl && (
                <img
                  src={op.imagenUrl}
                  alt={op.texto}
                  className="mb-3 h-32 w-full rounded-lg object-cover"
                />
              )}
              <div className="flex items-center gap-2">
                <span
                  className={`grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors ${
                    active
                      ? "border-brand-navy bg-brand-navy text-white"
                      : "border-brand-border bg-brand-paper"
                  }`}
                  aria-hidden
                >
                  {active && <Check className="size-3" strokeWidth={3} />}
                </span>
                <span className="font-medium text-brand-ink">{op.texto}</span>
              </div>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={submit}
        disabled={!sel.length || sending}
        className="w-full rounded-lg bg-brand-navy p-4 text-base font-semibold text-white shadow-sm transition-colors hover:bg-brand-navy-deep disabled:cursor-not-allowed disabled:opacity-50"
      >
        {sending ? "Enviando..." : "Enviar voto"}
      </button>
    </div>
  );
}
