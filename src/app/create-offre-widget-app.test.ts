// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/create-widget-instance-id", () => ({
  createWidgetInstanceId: () => "test-instance"
}));

vi.mock("@/offre/components/OffreWidgetRoot/OffreWidgetRoot.vue", () => ({
  default: {
    name: "OffreWidgetRoot",
    template: "<div />"
  }
}));

describe("createOffreWidgetApp", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("creates the Vue app boundary and applies widget host metadata", async () => {
    const container = document.createElement("div");
    document.body.append(container);

    const { createOffreWidgetApp } = await import("./create-offre-widget-app");
    const result = createOffreWidgetApp({
      container,
      payload: {
        brand: "sunmar",
        options: {},
        hotels: []
      }
    });

    expect(container.classList.contains("offre-widget-host")).toBe(true);
    expect(container.classList.contains("offre-theme--sunmar")).toBe(true);
    expect(container.getAttribute("data-offre-brand")).toBe("sunmar");
    expect(container.getAttribute("data-offre-theme")).toBe("default");
    expect(container.getAttribute("data-offre-widget-instance")).toBe("test-instance");
    expect(result.app).toBeTruthy();
    expect(result.queryClient).toBeTruthy();
    expect(result.brandDefinition.key).toBe("sunmar");
    expect(result.instanceId).toBe("test-instance");
    expect(result.container).toBe(container);
  });
});
