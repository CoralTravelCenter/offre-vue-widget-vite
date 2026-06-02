// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mountOffreWidgetMock } = vi.hoisted(() => ({
  mountOffreWidgetMock: vi.fn()
}));

vi.mock("@/app/create-offre-widget-app", () => ({
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
    instanceId: "test-widget-instance",
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
    expect(widget?.instanceId).toBe("test-widget-instance");
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

  it("bootstraps only scripts inside the provided root", async () => {
    document.body.innerHTML = `
      <div id="inside">
        <script type="application/json" data-offre-vue-test>{"brand":"coral"}</script>
      </div>
      <div id="outside">
        <script type="application/json" data-offre-vue-test>{"brand":"sunmar"}</script>
      </div>
    `;

    vi.resetModules();
    const { bootstrapOffreWidgets } = await import("./entry");
    const insideRoot = document.getElementById("inside") as HTMLElement;
    const outsideScript = document.querySelector("#outside script[data-offre-vue-test]") as HTMLScriptElement;
    const [widget] = bootstrapOffreWidgets(insideRoot);

    expect(widget).toBeTruthy();
    expect(insideRoot.contains(widget.rootElement)).toBe(true);
    expect(outsideScript.hasAttribute("data-offre-widget-mounted")).toBe(false);
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

  it("unmounts by script element and clears mount markers", async () => {
    document.body.innerHTML = `
      <div id="host">
        <script type="application/json" data-offre-vue-test>{"brand":"coral"}</script>
      </div>
    `;

    vi.resetModules();
    const { bootstrapOffreWidgets, unmountOffreWidget } = await import("./entry");
    const [widget] = bootstrapOffreWidgets();
    const scriptElement = widget.scriptElement;

    expect(scriptElement.getAttribute("data-offre-widget-mounted")).toBe("true");
    expect(scriptElement.getAttribute("data-offre-widget-instance-id")).toBe("test-widget-instance");

    expect(unmountOffreWidget(scriptElement)).toBe(true);
    expect(document.body.contains(widget.rootElement)).toBe(false);
    expect(scriptElement.hasAttribute("data-offre-widget-mounted")).toBe(false);
    expect(scriptElement.hasAttribute("data-offre-widget-instance-id")).toBe(false);
    expect(unmountOffreWidget(scriptElement)).toBe(false);
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

  it("registers the public window API for embed hosts", async () => {
    document.body.innerHTML = `
      <div>
        <script type="application/json" data-offre-vue-test>{"brand":"coral"}</script>
      </div>
    `;

    vi.resetModules();
    await import("./entry");
    const [widget] = window.OffreWidget?.bootstrap?.() ?? [];

    expect(window.OffreWidget?.bootstrap).toEqual(expect.any(Function));
    expect(window.OffreWidget?.mount).toEqual(expect.any(Function));
    expect(window.OffreWidget?.unmount).toEqual(expect.any(Function));
    expect(widget).toBeTruthy();
    expect(widget?.instanceId).toBe("test-widget-instance");
    expect(mountOffreWidgetMock).toHaveBeenCalledTimes(1);
  });
});
