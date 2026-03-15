// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mountOffreWidgetMock } = vi.hoisted(() => ({
  mountOffreWidgetMock: vi.fn()
}));

vi.mock("app/create-offre-widget-app", () => ({
  mountOffreWidget: mountOffreWidgetMock
}));

function createMountResult(container: Element) {
  return {
    app: {
      unmount: vi.fn()
    },
    instance: {},
    brandDefinition: {
      key: "coral" as const,
      title: "Coral Travel",
      themeClass: "offre-theme--coral",
      accentLabel: "Coral API",
      description: "Test brand"
    },
    container,
    queryClient: {
      clear: vi.fn()
    }
  };
}

describe("widget entry lifecycle", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    delete window.OffreWidget;
    mountOffreWidgetMock.mockReset();
    mountOffreWidgetMock.mockImplementation(({ container }) => createMountResult(container));
  });

  afterEach(() => {
    document.body.innerHTML = "";
    delete window.OffreWidget;
    vi.restoreAllMocks();
  });

  it("mounts into a dedicated root and preserves host DOM", async () => {
    document.body.innerHTML = `
        <div id="host">
        <div data-testid="keep">keep me</div>
        <script type="application/json" data-offre-vue-test>{"brand":"coral"}</script>
      </div>
    `;

    vi.resetModules();
    const { bootstrapOffreWidgets } = await import("./entry");
    const [widget] = bootstrapOffreWidgets();
    const host = document.getElementById("host");
    const preservedNode = document.querySelector("[data-testid='keep']");
    const scriptElement = host?.querySelector("script[data-offre-vue-test]") as HTMLScriptElement | null;

    expect(widget).toBeTruthy();
    expect(host?.contains(preservedNode)).toBe(true);
    expect(scriptElement?.nextElementSibling).toBe(widget?.rootElement);
    expect(widget?.container).toBe(widget?.rootElement);
    expect(mountOffreWidgetMock).toHaveBeenCalledTimes(1);
  });

  it("returns an existing widget on repeated bootstrap without remounting", async () => {
    document.body.innerHTML = `
      <div>
        <script type="application/json" data-offre-vue-test>{"brand":"coral"}</script>
      </div>
    `;

    vi.resetModules();
    const { bootstrapOffreWidgets } = await import("./entry");
    const firstMount = bootstrapOffreWidgets();
    const secondMount = bootstrapOffreWidgets();

    expect(firstMount).toHaveLength(1);
    expect(secondMount).toHaveLength(1);
    expect(secondMount[0]).toBe(firstMount[0]);
    expect(mountOffreWidgetMock).toHaveBeenCalledTimes(1);
  });

  it("unmounts a widget, clears the query client and removes the dedicated root", async () => {
    document.body.innerHTML = `
      <div id="host">
        <script type="application/json" data-offre-vue-test>{"brand":"sunmar"}</script>
      </div>
    `;

    vi.resetModules();
    const { bootstrapOffreWidgets, unmountOffreWidget } = await import("./entry");
    const [widget] = bootstrapOffreWidgets();
    const unmounted = unmountOffreWidget(widget);

    expect(unmounted).toBe(true);
    expect(widget.app.unmount).toHaveBeenCalledTimes(1);
    expect(widget.queryClient.clear).toHaveBeenCalledTimes(1);
    expect(document.body.contains(widget.rootElement)).toBe(false);
  });

  it("skips invalid JSON payloads and warns instead of throwing", async () => {
    document.body.innerHTML = `
      <div>
        <script type="application/json" data-offre-vue-test>{invalid json</script>
      </div>
    `;

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    vi.resetModules();
    const { bootstrapOffreWidgets } = await import("./entry");
    const mountedWidgets = bootstrapOffreWidgets();

    expect(mountedWidgets).toHaveLength(0);
    expect(mountOffreWidgetMock).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
  });

  it("normalizes invalid payload fields before mounting", async () => {
    document.body.innerHTML = `
      <div>
        <script type="application/json" data-offre-vue-test>{"brand":42,"options":[],"hotels":"bad"}</script>
      </div>
    `;

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    vi.resetModules();
    const { bootstrapOffreWidgets } = await import("./entry");
    const [widget] = bootstrapOffreWidgets();

    expect(widget.payload).toEqual({
      hotels: [],
      options: {}
    });
    expect(warnSpy).toHaveBeenCalledTimes(3);
  });
});
