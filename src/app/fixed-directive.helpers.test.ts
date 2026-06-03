// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import {
  applyFixedStateClasses,
  areFixedStatesEqual,
  computeFixedStateSnapshot,
  normalizeFixedConfig,
  normalizeLength,
  normalizeOffsetNumber,
  resolveFixedBoundaryElement,
  shouldAnchorFixedToBoundaryBottom
} from "@/app/fixed-directive.helpers";

describe("fixed-directive helpers", () => {
  it("normalizes the narrowed sticky config", () => {
    expect(normalizeFixedConfig(undefined)).toMatchObject({
      top: undefined,
      zIndex: null,
      onStick: null
    });

    const onStick = vi.fn();
    expect(normalizeFixedConfig({
      top: 12,
      zIndex: 30,
      onStick
    })).toMatchObject({
      top: 12,
      zIndex: 30,
      onStick
    });
  });

  it("normalizes offset values for css and numeric comparisons", () => {
    expect(normalizeLength(16)).toBe("16px");
    expect(normalizeLength(" 12 ")).toBe("12px");
    expect(normalizeLength("2rem")).toBe("2rem");
    expect(normalizeLength(null)).toBe("");

    expect(normalizeOffsetNumber(12, 0)).toBe(12);
    expect(normalizeOffsetNumber("15.5px", 0)).toBe(15.5);
    expect(normalizeOffsetNumber(undefined, 8)).toBe(8);
  });

  it("computes fixed states for the top-sticky mode", () => {
    expect(computeFixedStateSnapshot({
      rect: new DOMRect(0, 4, 100, 40),
      topOffset: 8
    })).toEqual({
      top: true,
      bottom: false,
      fixed: true
    });

    expect(computeFixedStateSnapshot({
      rect: new DOMRect(0, 32, 100, 40),
      topOffset: 8
    })).toEqual({
      top: false,
      bottom: false,
      fixed: false
    });
  });

  it("resolves state equality, css classes and boundary behavior", () => {
    const el = document.createElement("div");
    const boundary = document.createElement("section");
    boundary.className = "offre-widget";
    boundary.append(el);
    document.body.append(boundary);

    expect(resolveFixedBoundaryElement(el)).toBe(boundary);

    applyFixedStateClasses(el, { top: true, bottom: false, fixed: true });
    expect(el.classList.contains("top-fixed")).toBe(true);
    expect(el.classList.contains("fixeded")).toBe(true);
    expect(el.getAttribute("data-fixed")).toBe("true");

    expect(areFixedStatesEqual(
      { top: true, bottom: false, fixed: true },
      { top: true, bottom: false, fixed: true }
    )).toBe(true);

    expect(shouldAnchorFixedToBoundaryBottom({
      boundaryRect: new DOMRect(0, 0, 300, 48),
      referenceRect: new DOMRect(0, 0, 300, 40),
      topOffset: 8
    })).toBe(true);

    document.body.innerHTML = "";
  });
});
