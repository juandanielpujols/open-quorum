import { describe, it, expect, vi } from "vitest";
import { EventBus } from "./eventbus";

describe("EventBus", () => {
  it("delivers events to subscribers of a channel", () => {
    const bus = new EventBus();
    const cb = vi.fn();
    bus.subscribe("canal-a", cb);
    bus.publish("canal-a", { tipo: "voto:registrado", preguntaId: "p1", eventoId: "e1", total: 1 });
    expect(cb).toHaveBeenCalledWith({ tipo: "voto:registrado", preguntaId: "p1", eventoId: "e1", total: 1 });
  });

  it("does not deliver to other channels", () => {
    const bus = new EventBus();
    const cb = vi.fn();
    bus.subscribe("canal-a", cb);
    bus.publish("canal-b", { tipo: "pregunta:abierta", preguntaId: "p1", eventoId: "e1" });
    expect(cb).not.toHaveBeenCalled();
  });

  it("unsubscribe stops delivery", () => {
    const bus = new EventBus();
    const cb = vi.fn();
    const unsub = bus.subscribe("canal-a", cb);
    unsub();
    bus.publish("canal-a", { tipo: "pregunta:cerrada", preguntaId: "p1", eventoId: "e1" });
    expect(cb).not.toHaveBeenCalled();
  });

  it("supports multiple subscribers on same channel", () => {
    const bus = new EventBus();
    const a = vi.fn(), b = vi.fn();
    bus.subscribe("canal", a);
    bus.subscribe("canal", b);
    bus.publish("canal", { tipo: "pregunta:revelada", preguntaId: "p1", eventoId: "e1" });
    expect(a).toHaveBeenCalledOnce();
    expect(b).toHaveBeenCalledOnce();
  });
});
