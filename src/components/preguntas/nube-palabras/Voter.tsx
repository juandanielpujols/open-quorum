"use client";
import { useState } from "react";
import { X } from "lucide-react";
import type { ConfigNubePalabras } from "./Schema";

type Props = {
  config: ConfigNubePalabras;
  onSubmit: (palabras: string[]) => Promise<void>;
};

export function VoterNubePalabras({ config, onSubmit }: Props) {
  const [actual, setActual] = useState("");
  const [palabras, setPalabras] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  function agregar() {
    const limpia = actual.trim();
    if (!limpia) return;
    if (palabras.length >= config.palabrasPorVotante) return;
    if (palabras.map((p) => p.toLowerCase()).includes(limpia.toLowerCase())) {
      setActual("");
      return;
    }
    setPalabras([...palabras, limpia]);
    setActual("");
  }

  function quitar(i: number) {
    setPalabras(palabras.filter((_, idx) => idx !== i));
  }

  async function submit() {
    if (palabras.length === 0) return;
    setSending(true);
    await onSubmit(palabras);
    setSending(false);
    setDone(true);
  }

  if (done)
    return <p className="text-center py-8 text-sb-verde">✓ Tus palabras fueron registradas</p>;

  const puedeAgregar = palabras.length < config.palabrasPorVotante;

  return (
    <div className="space-y-3">
      <p className="text-xs text-brand-muted">
        Agrega hasta {config.palabrasPorVotante} palabra{config.palabrasPorVotante === 1 ? "" : "s"}.
        Máximo {config.maxCaracteres} caracteres cada una.
      </p>

      <div className="flex gap-2">
        <input
          value={actual}
          onChange={(e) => setActual(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              agregar();
            }
          }}
          maxLength={config.maxCaracteres}
          disabled={!puedeAgregar}
          placeholder={puedeAgregar ? "Escribe una palabra..." : "Alcanzaste el máximo"}
          className="h-12 flex-1 rounded-lg border border-brand-border bg-brand-paper px-4 text-[15px] text-brand-ink placeholder:text-brand-muted/70 focus-visible:border-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/15 disabled:opacity-50"
        />
        <button
          type="button"
          onClick={agregar}
          disabled={!actual.trim() || !puedeAgregar}
          className="rounded-lg border border-brand-border bg-brand-paper px-4 text-sm font-medium text-brand-ink hover:border-brand-navy/40 disabled:opacity-50"
        >
          Agregar
        </button>
      </div>

      {palabras.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {palabras.map((p, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded-full border border-brand-border bg-brand-cream-deep/50 px-3 py-1 text-sm text-brand-ink"
            >
              {p}
              <button
                type="button"
                onClick={() => quitar(i)}
                aria-label={`Quitar ${p}`}
                className="text-brand-muted hover:text-brand-crimson"
              >
                <X className="size-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      <button
        onClick={submit}
        disabled={palabras.length === 0 || sending}
        className="w-full rounded-lg bg-brand-navy p-3 text-white disabled:opacity-50"
      >
        {sending ? "Enviando..." : `Enviar ${palabras.length || ""}`}
      </button>
    </div>
  );
}
