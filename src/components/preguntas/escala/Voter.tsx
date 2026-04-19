"use client";
import { useState } from "react";
import type { ConfigEscala } from "./Schema";
import { Check } from "lucide-react";

type Props = { config: ConfigEscala; onSubmit: (valor: number) => Promise<void> };

export function VoterEscala({ config, onSubmit }: Props) {
  const [sel, setSel] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);
  const valores = Array.from(
    { length: config.max - config.min + 1 },
    (_, i) => config.min + i,
  );

  async function submit() {
    if (sel === null) return;
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
      <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-brand-muted">
        <span>{config.etiquetaMin}</span>
        <span>{config.etiquetaMax}</span>
      </div>
      <div className="grid auto-cols-fr grid-flow-col gap-2">
        {valores.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setSel(v)}
            className={`rounded-xl border-2 p-4 text-xl font-semibold transition-all active:scale-[0.97] ${
              sel === v
                ? "border-brand-navy bg-brand-navy text-white shadow-sm"
                : "border-brand-border bg-brand-paper text-brand-ink hover:border-brand-navy/40"
            }`}
          >
            {v}
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled={sel === null || sending}
        onClick={submit}
        className="w-full rounded-lg bg-brand-navy p-4 text-base font-semibold text-white shadow-sm transition-colors hover:bg-brand-navy-deep disabled:cursor-not-allowed disabled:opacity-50"
      >
        {sending ? "Enviando..." : "Enviar voto"}
      </button>
    </div>
  );
}
