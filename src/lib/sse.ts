import type { BusEvent } from "./eventbus";
import { eventBus, canalEvento } from "./eventbus";
import { LIMITS } from "./rate-limit";

export function formatoSSE(event: BusEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

/**
 * Contador de conexiones SSE activas por IP.
 * Mitiga: un atacante abriendo 10k+ conexiones SSE simultáneas para agotar
 * file descriptors del proceso Node. Corta antes de llegar al límite del kernel.
 */
const conexionesPorIp = new Map<string, number>();

export function reservarSlotSSE(ip: string): boolean {
  const actual = conexionesPorIp.get(ip) ?? 0;
  if (actual >= LIMITS.SSE_CONCURRENT.max) return false;
  conexionesPorIp.set(ip, actual + 1);
  return true;
}

export function liberarSlotSSE(ip: string): void {
  const actual = conexionesPorIp.get(ip) ?? 0;
  if (actual <= 1) conexionesPorIp.delete(ip);
  else conexionesPorIp.set(ip, actual - 1);
}

export function crearStreamEvento(eventoId: string, ip: string): ReadableStream<Uint8Array> {
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
      liberarSlotSSE(ip);
    },
  });
}
