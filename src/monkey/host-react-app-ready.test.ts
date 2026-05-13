// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { hostReactAppReady } from "./host-react-app-ready";

function createDomRect(height: number): DOMRect {
  return {
    bottom: height,
    height,
    left: 0,
    right: 0,
    toJSON: () => ({}),
    top: 0,
    width: 0,
    x: 0,
    y: 0
  } as DOMRect;
}

describe("hostReactAppReady", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.useFakeTimers();
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.useRealTimers();
  });

  it("resolves when the host element becomes visible", async () => {
    let ready = false;
    const hostElement = document.createElement("div");

    hostElement.id = "host";
    Object.defineProperty(hostElement, "getBoundingClientRect", {
      configurable: true,
      value: () => createDomRect(ready ? 120 : 0)
    });
    document.body.append(hostElement);

    const readyPromise = hostReactAppReady("#host", {
      intervalMs: 50,
      timeoutMs: 500
    });

    await vi.advanceTimersByTimeAsync(100);
    ready = true;
    await vi.advanceTimersByTimeAsync(50);

    await expect(readyPromise).resolves.toBe(hostElement);
  });

  it("rejects with a descriptive error when timeout is reached", async () => {
    const readyPromise = hostReactAppReady("#missing-host", {
      intervalMs: 50,
      timeoutMs: 200
    });

    const expectation = expect(readyPromise).rejects.toThrow(
      'OffreWidget: host React app was not ready within 200ms for selector "#missing-host"',
    );

    await vi.advanceTimersByTimeAsync(250);
    await expectation;
  });
});
