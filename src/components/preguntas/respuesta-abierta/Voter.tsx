"use client";
import { useState } from "react";
import type { ConfigRespuestaAbierta } from "./Schema";

type Props = {
  config: ConfigRespuestaAbierta;
  onSubmit: (texto: string) => Promise<void>;
};

export function VoterRespuestaAbierta({ config, onSubmit }: Props) {
  const [texto, setTexto] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    const limpia = texto.trim();
    if (!limpia) return;
    setSending(true);
    await onSubmit(limpia);
    setSending(false);
    setDone(true);
  }

  if (done)
    return <p className="text-center py-8 text-sb-verde">✓ Tu respuesta fue registrada</p>;

  const restantes = config.maxCaracteres - texto.length;

  return (
    <div className="space-y-3">
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value.slice(0, config.maxCaracteres))}
        rows={5}
        maxLength={config.maxCaracteres}
        placeholder="Escribe tu respuesta..."
        className="w-full rounded-lg border border-brand-border bg-brand-paper p-3 text-[15px] text-brand-ink placeholder:text-brand-muted/70 focus-visible:border-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/15"
      />
      <div className="flex items-center justify-between text-xs text-brand-muted">
        <span>Máx. {config.maxCaracteres} caracteres</span>
        <span className={restantes < 50 ? "text-brand-crimson" : ""}>{restantes}</span>
      </div>
      <button
        onClick={submit}
        disabled={!texto.trim() || sending}
        className="w-full rounded-lg bg-brand-navy p-3 text-white disabled:opacity-50"
      >
        {sending ? "Enviando..." : "Enviar respuesta"}
      </button>
    </div>
  );
}
