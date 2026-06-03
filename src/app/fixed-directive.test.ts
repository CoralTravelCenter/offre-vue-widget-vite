// @vitest-environment jsdom

import { createApp, nextTick } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fixedDirective from "@/app/fixed-directive";

class ResizeObserverMock {
  observe() {}
  disconnect() {}
}

function createRect(rect: Partial<DOMRect>) {
  return {
    x: rect.left ?? 0,
    y: rect.top ?? 0,
    top: rect.top ?? 0,
    left: rect.left ?? 0,
    bottom: rect.bottom ?? 0,
    right: rect.right ?? 0,
    width: rect.width ?? 0,
    height: rect.height ?? 0,
    toJSON() {
      return {};
    }
  } as DOMRect;
}

describe("fixedDirective", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.stubGlobal("ResizeObserver", ResizeObserverMock);
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.unstubAllGlobals();
  });

  it("toggles fixed state on mount and cleans up on unmount", async () => {
    const host = document.createElement("div");
    document.body.append(host);

    const getComputedStyleSpy = vi.spyOn(window, "getComputedStyle").mockImplementation(() => {
      return {
        overflow: "visible",
        overflowX: "visible",
        overflowY: "visible",
        marginTop: "4px",
        marginBottom: "6px"
      } as CSSStyleDeclaration;
    });

    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 900
    });

    const app = createApp({
      template: "<div id='target' v-fixed='{ top: 12, zIndex: 30 }'>content</div>"
    });

    app.directive("fixed", fixedDirective);
    app.mount(host);
    await nextTick();

    const target = host.querySelector("#target") as HTMLElement;
    const placeholder = target.nextElementSibling as HTMLDivElement | null;

    target.getBoundingClientRect = () => createRect({
      top: 8,
      bottom: 48,
      left: 20,
      right: 220,
      width: 200,
      height: 40
    });
    if (!placeholder) {
      throw new Error("expected placeholder to be created");
    }

    placeholder.getBoundingClientRect = () => createRect({
      top: 8,
      bottom: 48,
      left: 20,
      right: 220,
      width: 200,
      height: 40
    });

    (fixedDirective as {
      updated?: (el: HTMLElement, binding: {
        instance: null;
        value: { top: number; zIndex: number };
        oldValue: undefined;
        arg: undefined;
        modifiers: Record<string, never>;
        dir: typeof fixedDirective;
      }) => void;
    }).updated?.(target, {
      instance: null,
      value: { top: 12, zIndex: 30 },
      oldValue: undefined,
      arg: undefined,
      modifiers: {},
      dir: fixedDirective
    });

    expect(target.style.position).toBe("fixed");
    expect(target.style.top).toBe("12px");
    expect(target.style.left).toBe("20px");
    expect(target.style.width).toBe("200px");
    expect(target.style.zIndex).toBe("30");
    expect(target.getAttribute("data-fixed")).toBe("true");
    expect(target.classList.contains("sticked")).toBe(true);
    expect(placeholder?.style.display).toBe("block");

    app.unmount();

    expect(host.querySelector("#target")).toBeNull();
    expect(host.children).toHaveLength(0);
    getComputedStyleSpy.mockRestore();
  });
});
