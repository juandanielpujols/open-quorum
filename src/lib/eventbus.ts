export type BusEvent =
  | { tipo: "pregunta:abierta"; preguntaId: string; eventoId: string }
  | { tipo: "pregunta:cerrada"; preguntaId: string; eventoId: string }
  | { tipo: "pregunta:revelada"; preguntaId: string; eventoId: string }
  | { tipo: "voto:registrado"; preguntaId: string; eventoId: string; total: number }
  | { tipo: "evento:finalizado"; eventoId: string }
  | { tipo: "snapshot"; payload: unknown };

type Subscriber = (e: BusEvent) => void;

export class EventBus {
  private subs = new Map<string, Set<Subscriber>>();

  subscribe(canal: string, cb: Subscriber): () => void {
    if (!this.subs.has(canal)) this.subs.set(canal, new Set());
    this.subs.get(canal)!.add(cb);
    return () => {
      this.subs.get(canal)?.delete(cb);
    };
  }

  publish(canal: string, event: BusEvent): void {
    this.subs.get(canal)?.forEach((cb) => cb(event));
  }

  contarSuscriptores(canal: string): number {
    return this.subs.get(canal)?.size ?? 0;
  }
}

const globalForBus = globalThis as unknown as { eventBus?: EventBus };
export const eventBus = globalForBus.eventBus ?? new EventBus();
if (process.env.NODE_ENV !== "production") globalForBus.eventBus = eventBus;

export function canalEvento(eventoId: string): string {
  return `evento:${eventoId}`;
}
