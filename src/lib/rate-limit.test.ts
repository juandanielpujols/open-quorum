import { describe, it, expect, vi } from "vitest";
import { checkRateLimit } from "./rate-limit";

describe("checkRateLimit", () => {
  it("permite hasta N requests en la ventana", () => {
    const key = "test:" + Math.random();
    for (let i = 0; i < 5; i++) expect(checkRateLimit(key, 5, 1000).ok).toBe(true);
    expect(checkRateLimit(key, 5, 1000).ok).toBe(false);
  });

  it("se resetea tras la ventana", () => {
    const key = "test:" + Math.random();
    vi.useFakeTimers();
    checkRateLimit(key, 2, 1000);
    checkRateLimit(key, 2, 1000);
    expect(checkRateLimit(key, 2, 1000).ok).toBe(false);
    vi.advanceTimersByTime(1100);
    expect(checkRateLimit(key, 2, 1000).ok).toBe(true);
    vi.useRealTimers();
  });
});
