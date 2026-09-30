import { afterEach, describe, expect, it, vi } from "vitest";
import {
  classifyB2CApiFailure,
  listHotelsInfo,
  packagePriceSearchList
} from "@/offre/api-client";
import type { B2CPriceSearchCriterias } from "@/offre/api-types";

function createPendingFetch() {
  return vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
    return new Promise<Response>((_resolve, reject) => {
      const signal = init?.signal;

      signal?.addEventListener("abort", () => {
        reject(signal.reason);
      }, { once: true });
    });
  });
}

describe("B2C API client failures", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("classifies transport and HTTP failures", async () => {
    expect(classifyB2CApiFailure(new TypeError("network"))).toEqual({ kind: "transport" });

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      statusText: "Service Unavailable"
    }));

    const request = listHotelsInfo([101]);

    await expect(request).rejects.toMatchObject({
      kind: "http",
      status: 503
    });
  });

  it("aborts price search when its timeout expires", async () => {
    vi.useFakeTimers();
    const fetchMock = createPendingFetch();
    vi.stubGlobal("fetch", fetchMock);

    const request = packagePriceSearchList({} as B2CPriceSearchCriterias, { timeoutMs: 25 });
    const rejection = expect(request).rejects.toMatchObject({ name: "TimeoutError" });

    await vi.advanceTimersByTimeAsync(25);
    await rejection;

    const requestSignal = fetchMock.mock.calls[0]?.[1]?.signal;
    expect(requestSignal?.aborted).toBe(true);
  });

  it("preserves caller cancellation as an abort", async () => {
    const controller = new AbortController();
    const fetchMock = createPendingFetch();
    vi.stubGlobal("fetch", fetchMock);

    const request = packagePriceSearchList({} as B2CPriceSearchCriterias, {
      signal: controller.signal,
      timeoutMs: 100
    });
    const rejection = expect(request).rejects.toMatchObject({ name: "AbortError" });

    controller.abort();
    await rejection;

    expect(classifyB2CApiFailure(controller.signal.reason)).toEqual({ kind: "abort" });
    expect(fetchMock.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
  });
});
