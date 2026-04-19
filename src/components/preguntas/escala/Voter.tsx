"use client";
import { useState } from "react";
import type { ConfigEscala } from "./Schema";

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
    return <p className="text-center py-8 text-sb-verde">✓ Tu voto fue registrado</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-sb-gris">
        <span>{config.etiquetaMin}</span>
        <span>{config.etiquetaMax}</span>
      </div>
      <div className="grid grid-flow-col auto-cols-fr gap-2">
        {valores.map((v) => (
          <button
            key={v}
            onClick={() => setSel(v)}
            className={`rounded-xl p-4 text-xl font-semibold border ${
              sel === v ? "border-sb-azul bg-sb-azul text-white" : "border-gray-200 bg-white"
            }`}
          >
            {v}
          </button>
        ))}
      </div>
      <button
        disabled={sel === null || sending}
        onClick={submit}
        className="w-full bg-sb-azul text-white rounded-lg p-3 disabled:opacity-50"
      >
        {sending ? "Enviando..." : "Enviar voto"}
      </button>
    </div>
  );
}
