"use client";
import { useState, useTransition } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { CheckSquare, Loader2 } from "lucide-react";

export function FinalizarEventoDialog({
  eventoNombre,
  onConfirm,
}: {
  eventoNombre: string;
  onConfirm: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          className="border-brand-crimson/40 text-brand-crimson hover:bg-brand-crimson/10 hover:text-brand-crimson-deep"
        >
          <CheckSquare aria-hidden className="size-4" />
          Finalizar evento
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="border-brand-border bg-brand-paper">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display text-xl text-brand-ink">
            ¿Finalizar el evento?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-brand-body">
            Vas a finalizar <span className="font-medium text-brand-ink">{eventoNombre}</span>.
            No podrás abrir, cerrar o revelar más preguntas después de esto.
            Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={isPending}
            className="border-brand-border text-brand-body hover:bg-brand-cream"
          >
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={(e) => {
              e.preventDefault();
              startTransition(async () => {
                await onConfirm();
                setOpen(false);
              });
            }}
            className="bg-brand-crimson text-white hover:bg-brand-crimson-deep"
          >
            {isPending ? (
              <>
                <Loader2 aria-hidden className="size-4 animate-spin" />
                Finalizando...
              </>
            ) : (
              <>Sí, finalizar</>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
