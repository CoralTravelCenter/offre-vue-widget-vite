// @vitest-environment jsdom

import { createApp, nextTick, ref } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useOffreWidgetVisibilityState } from "@/offre/composables/useOffreWidgetVisibilityState";

describe("useOffreWidgetVisibilityState", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.unstubAllGlobals();
  });

  it("marks the widget visible once it intersects the viewport", async () => {
    type IntersectionCallback = (entries: Array<{ target: Element; isIntersecting: boolean }>) => void;
    let intersectionCallback: IntersectionCallback = () => undefined;
    const observe = vi.fn();
    const disconnect = vi.fn();

    vi.stubGlobal("IntersectionObserver", class {
      constructor(callback: IntersectionCallback) {
        intersectionCallback = callback;
      }

      observe = observe;
      disconnect = disconnect;
    });

    const host = document.createElement("div");
    document.body.append(host);
    const widgetElement = document.createElement("div");

    const app = createApp({
      setup() {
        const targetRef = ref<HTMLElement | null>(widgetElement);
        const state = useOffreWidgetVisibilityState({ targetRef });

        return {
          hasEnteredViewport: state.hasEnteredViewport
        };
      },
      template: "<div />"
    });

    const instance = app.mount(host) as unknown as { hasEnteredViewport: boolean };
    await nextTick();

    expect(instance.hasEnteredViewport).toBe(false);
    expect(observe).toHaveBeenCalledWith(widgetElement);

    intersectionCallback([{ target: widgetElement, isIntersecting: true }]);
    await nextTick();

    expect(instance.hasEnteredViewport).toBe(true);
    expect(disconnect).toHaveBeenCalledTimes(1);

    app.unmount();
  });

  it("falls back to immediate visibility when IntersectionObserver is unavailable", async () => {
    vi.stubGlobal("IntersectionObserver", undefined);

    const host = document.createElement("div");
    document.body.append(host);

    const app = createApp({
      setup() {
        const state = useOffreWidgetVisibilityState({
          targetRef: ref(document.createElement("div"))
        });

        return {
          hasEnteredViewport: state.hasEnteredViewport
        };
      },
      template: "<div />"
    });

    const instance = app.mount(host) as unknown as { hasEnteredViewport: boolean };
    await nextTick();

    expect(instance.hasEnteredViewport).toBe(true);

    app.unmount();
  });
});
