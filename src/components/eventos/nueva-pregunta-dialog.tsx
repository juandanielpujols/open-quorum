"use client";
import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const fieldCls =
  "h-10 w-full rounded-md border border-brand-border bg-brand-paper px-3 text-sm text-brand-ink placeholder:text-brand-muted/70 shadow-none transition-[border-color,box-shadow] duration-150 ease-out focus-visible:border-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/15";

const labelCls =
  "text-[11px] font-bold uppercase tracking-[0.12em] text-brand-muted";

export function NuevaPreguntaDialog({
  onCrear,
}: {
  onCrear: (fd: FormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [tipo, setTipo] = useState<"OPCION_MULTIPLE" | "SI_NO" | "ESCALA">("OPCION_MULTIPLE");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await onCrear(fd);
      setOpen(false);
      // Reset local state para próxima apertura
      setTipo("OPCION_MULTIPLE");
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-brand-navy text-white hover:bg-brand-navy-deep">
          <Plus aria-hidden className="size-4" />
          Nueva pregunta
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-brand-border bg-brand-paper sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-brand-ink">
            Nueva pregunta
          </DialogTitle>
          <DialogDescription className="text-brand-body">
            Las preguntas permanecen editables mientras estén en estado{" "}
            <span className="font-medium text-brand-ink">BORRADOR</span>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="enunciado" className={labelCls}>
              Enunciado
            </Label>
            <Input
              id="enunciado"
              name="enunciado"
              placeholder="Ej: ¿Aprobamos el presupuesto 2026?"
              required
              autoFocus
              className={fieldCls}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="tipo" className={labelCls}>
                Tipo
              </Label>
              <select
                id="tipo"
                name="tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value as typeof tipo)}
                className={fieldCls}
              >
                <option value="OPCION_MULTIPLE">Opción múltiple</option>
                <option value="SI_NO">Sí / No</option>
                <option value="ESCALA">Escala 1-5</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="visibilidad" className={labelCls}>
                Visibilidad de resultados
              </Label>
              <select id="visibilidad" name="visibilidad" className={fieldCls}>
                <option value="OCULTO_HASTA_CERRAR">Oculto hasta cerrar</option>
                <option value="EN_VIVO">En vivo</option>
              </select>
            </div>
          </div>

          {/* Campos específicos por tipo */}
          {tipo === "OPCION_MULTIPLE" && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="opciones" className={labelCls}>
                  Opciones (una por línea)
                </Label>
                <textarea
                  id="opciones"
                  name="opciones"
                  required
                  placeholder="Opción A&#10;Opción B&#10;Opción C"
                  rows={4}
                  className={cn(fieldCls, "h-auto py-2 font-mono text-xs")}
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    name="permitirMultiple"
                    className="size-3.5 accent-brand-navy"
                  />
                  Permitir múltiples
                </label>
                <div>
                  <Label className={cn(labelCls, "mb-1 block")}>Máx. selecciones</Label>
                  <Input
                    name="maxSelecciones"
                    type="number"
                    min={1}
                    defaultValue={1}
                    className={fieldCls}
                  />
                </div>
              </div>
            </>
          )}

          {tipo === "ESCALA" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className={cn(labelCls, "mb-1 block")}>Valor mínimo</Label>
                <Input
                  name="escalaMin"
                  type="number"
                  defaultValue={1}
                  className={fieldCls}
                />
              </div>
              <div>
                <Label className={cn(labelCls, "mb-1 block")}>Valor máximo</Label>
                <Input
                  name="escalaMax"
                  type="number"
                  defaultValue={5}
                  className={fieldCls}
                />
              </div>
              <div>
                <Label className={cn(labelCls, "mb-1 block")}>Etiqueta mín.</Label>
                <Input
                  name="escalaEtiMin"
                  placeholder="Poco"
                  className={fieldCls}
                />
              </div>
              <div>
                <Label className={cn(labelCls, "mb-1 block")}>Etiqueta máx.</Label>
                <Input
                  name="escalaEtiMax"
                  placeholder="Mucho"
                  className={fieldCls}
                />
              </div>
            </div>
          )}

          {tipo === "SI_NO" && (
            <p className="rounded-md border border-brand-border bg-brand-cream px-3 py-2 text-xs text-brand-muted">
              Las opciones "Sí" y "No" se generan automáticamente.
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
              className="border-brand-border text-brand-body hover:bg-brand-cream"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-brand-navy text-white hover:bg-brand-navy-deep"
            >
              {isPending ? (
                <>
                  <Loader2 aria-hidden className="size-4 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Plus aria-hidden className="size-4" />
                  Crear pregunta
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
