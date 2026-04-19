import type { BusEvent } from "./eventbus";
import { eventBus, canalEvento } from "./eventbus";

export function formatoSSE(event: BusEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export function crearStreamEvento(eventoId: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;

  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(": connected\n\n"));
      unsubscribe = eventBus.subscribe(canalEvento(eventoId), (event) => {
        try {
          controller.enqueue(encoder.encode(formatoSSE(event)));
        } catch {
          /* cliente cerró */
        }
      });
      heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          /* ignore */
        }
      }, 25_000);
    },
    cancel() {
      unsubscribe?.();
      if (heartbeat) clearInterval(heartbeat);
    },
  });
}
