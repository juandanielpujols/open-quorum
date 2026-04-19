"use client";
import { useState } from "react";
import type { Opcion } from "@/generated/prisma";
import { DndContext, closestCenter, type DragEndEvent, PointerSensor, KeyboardSensor, useSensor, useSensors } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, GripVertical } from "lucide-react";

type Props = {
  opciones: Opcion[];
  onSubmit: (ordenOpciones: string[]) => Promise<void>;
};

function Item({ opcion, posicion }: { opcion: Opcion; posicion: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: opcion.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-3 rounded-lg border bg-brand-paper px-3 py-3 ${
        isDragging ? "border-brand-navy shadow-lg" : "border-brand-border"
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Mover ${opcion.texto}`}
        className="flex size-8 shrink-0 cursor-grab items-center justify-center rounded text-brand-muted hover:text-brand-ink active:cursor-grabbing"
      >
        <GripVertical aria-hidden className="size-4" />
      </button>
      <span className="shrink-0 rounded bg-brand-cream-deep px-1.5 py-0.5 font-mono text-[11px] font-semibold tabular-nums text-brand-body">
        {String(posicion).padStart(2, "0")}
      </span>
      <span className="flex-1 text-[15px] text-brand-ink">{opcion.texto}</span>
    </div>
  );
}

export function VoterRanking({ opciones, onSubmit }: Props) {
  const [orden, setOrden] = useState<string[]>(opciones.map((o) => o.id));
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setOrden((current) => {
      const oldIndex = current.indexOf(active.id as string);
      const newIndex = current.indexOf(over.id as string);
      return arrayMove(current, oldIndex, newIndex);
    });
  }

  async function submit() {
    setSending(true);
    await onSubmit(orden);
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

  // Map opcionId → opcion para render
  const byId = new Map(opciones.map((o) => [o.id, o]));

  return (
    <div className="space-y-3">
      <p className="text-xs text-brand-muted">
        Arrastra para ordenar de mayor a menor preferencia.
      </p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={orden} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {orden.map((id, i) => {
              const op = byId.get(id);
              if (!op) return null;
              return <Item key={id} opcion={op} posicion={i + 1} />;
            })}
          </div>
        </SortableContext>
      </DndContext>
      <button
        type="button"
        onClick={submit}
        disabled={sending}
        className="w-full rounded-lg bg-brand-navy p-4 text-base font-semibold text-white shadow-sm transition-colors hover:bg-brand-navy-deep disabled:cursor-not-allowed disabled:opacity-50"
      >
        {sending ? "Enviando..." : "Enviar orden"}
      </button>
    </div>
  );
}
