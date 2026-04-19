"use client";
import { useState } from "react";
import type { Opcion } from "@/generated/prisma";
import type { ConfigOpcionMultiple } from "./Schema";

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
    return <p className="text-center py-8 text-sb-verde">✓ Tu voto fue registrado</p>;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {opciones.map((op) => {
          const active = sel.includes(op.id);
          return (
            <button
              key={op.id}
              onClick={() => toggle(op.id)}
              className={`border rounded-xl p-3 text-left transition-all ${
                active ? "border-sb-azul bg-sb-azul/5" : "border-gray-200 bg-white"
              }`}
            >
              {op.imagenUrl && (
                <img
                  src={op.imagenUrl}
                  alt={op.texto}
                  className="w-full h-32 object-cover rounded-lg mb-2"
                />
              )}
              <span className="font-medium">{op.texto}</span>
            </button>
          );
        })}
      </div>
      <button
        onClick={submit}
        disabled={!sel.length || sending}
        className="w-full bg-sb-azul text-white rounded-lg p-3 disabled:opacity-50"
      >
        {sending ? "Enviando..." : "Enviar voto"}
      </button>
    </div>
  );
}
