import { afterEach, describe, expect, it, vi } from "vitest";

describe("createWidgetInstanceId", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("uses crypto.randomUUID when available", async () => {
    const randomUUID = vi.fn(() => "uuid-from-crypto");
    vi.stubGlobal("crypto", { randomUUID });

    const { createWidgetInstanceId } = await import("./create-widget-instance-id");

    expect(createWidgetInstanceId()).toBe("uuid-from-crypto");
    expect(randomUUID).toHaveBeenCalledTimes(1);
  });

  it("falls back to a local instance id generator when crypto.randomUUID is unavailable", async () => {
    vi.stubGlobal("crypto", {});

    const { createWidgetInstanceId } = await import("./create-widget-instance-id");
    const firstId = createWidgetInstanceId();
    const secondId = createWidgetInstanceId();

    expect(firstId).toMatch(/^offre-/);
    expect(secondId).toMatch(/^offre-/);
    expect(secondId).not.toBe(firstId);
  });
});
