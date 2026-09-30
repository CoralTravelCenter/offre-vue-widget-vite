// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  canUseSessionStorage,
  createSessionStorageAdapter,
  shouldRetryOffreBootstrapQuery
} from "@/offre/query";

describe("offre query retry policy", () => {
  it("retries a transport failure only once", () => {
    const error = new TypeError("network");

    expect(shouldRetryOffreBootstrapQuery(0, error)).toBe(true);
    expect(shouldRetryOffreBootstrapQuery(1, error)).toBe(false);
  });

  it.each([408, 502, 503, 504])("retries HTTP %s once", (status) => {
    expect(shouldRetryOffreBootstrapQuery(0, { kind: "http", status })).toBe(true);
  });

  it.each([400, 404, 429, 500])("does not retry HTTP %s", (status) => {
    expect(shouldRetryOffreBootstrapQuery(0, { kind: "http", status })).toBe(false);
  });

  it.each(["AbortError", "TimeoutError"])("does not retry %s", (name) => {
    expect(shouldRetryOffreBootstrapQuery(0, { name })).toBe(false);
  });
});

describe("offre query persistence storage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns false when sessionStorage access throws", () => {
    const originalDescriptor = Object.getOwnPropertyDescriptor(window, "sessionStorage");

    Object.defineProperty(window, "sessionStorage", {
      configurable: true,
      get() {
        throw new Error("blocked");
      }
    });

    expect(canUseSessionStorage()).toBe(false);

    if (originalDescriptor) {
      Object.defineProperty(window, "sessionStorage", originalDescriptor);
    }
  });

  it("swallows storage operation failures in the adapter", () => {
    const adapter = createSessionStorageAdapter();

    expect(adapter).toBeTruthy();
    expect(adapter).not.toBeUndefined();

    const getItemSpy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("read blocked");
    });
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("write blocked");
    });
    const removeItemSpy = vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("remove blocked");
    });

    if (!adapter) {
      throw new Error("Expected session storage adapter to be created");
    }

    expect(adapter.entries).toBeTypeOf("function");

    expect(adapter.getItem("key")).toBeNull();
    expect(() => adapter.setItem("key", "value")).not.toThrow();
    expect(() => adapter.removeItem("key")).not.toThrow();
    expect(() => adapter.entries?.()).not.toThrow();

    expect(getItemSpy).toHaveBeenCalled();
    expect(setItemSpy).toHaveBeenCalled();
    expect(removeItemSpy).toHaveBeenCalled();
  });
});
