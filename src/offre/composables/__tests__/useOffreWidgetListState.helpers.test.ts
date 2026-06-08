import { afterEach, describe, expect, it, vi } from "vitest";
import {
  canUseSessionStorage,
  isOffreViewMode,
  paginateProducts,
  pruneTourTypeByHotelId,
  resolveTotalItems,
  resolveViewModeStorageKey,
  setNextHotelTourType
} from "@/offre/composables/useOffreWidgetListState.helpers";

describe("useOffreWidgetListState helpers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("validates and resolves view mode storage keys", () => {
    expect(isOffreViewMode("list")).toBe(true);
    expect(isOffreViewMode("grid")).toBe(false);
    expect(resolveViewModeStorageKey(" widget-1 ")).toBe("offre-widget:view-mode:widget-1");
  });

  it("returns false when sessionStorage access throws", () => {
    const originalWindowDescriptor = Object.getOwnPropertyDescriptor(globalThis, "window");
    const mockWindow = {};

    Object.defineProperty(mockWindow, "sessionStorage", {
      configurable: true,
      get() {
        throw new Error("blocked");
      }
    });

    Object.defineProperty(globalThis, "window", {
      configurable: true,
      get() {
        return mockWindow;
      }
    });

    expect(canUseSessionStorage()).toBe(false);

    if (originalWindowDescriptor) {
      Object.defineProperty(globalThis, "window", originalWindowDescriptor);
    } else {
      Reflect.deleteProperty(globalThis, "window");
    }
  });

  it("resolves total items and paginates product lists", () => {
    const products = [
      { hotel: { id: "101" } },
      { hotel: { id: "202" } },
      { hotel: { id: "303" } }
    ];

    expect(resolveTotalItems(products, undefined)).toBe(3);
    expect(resolveTotalItems(products, 10)).toBe(10);
    expect(paginateProducts(products, 2, 2, false)).toEqual([
      { hotel: { id: "303" } }
    ]);
    expect(paginateProducts(products, 1, 2, true)).toEqual(products);
  });

  it("prunes stale tour types and sets the next hotel tour type immutably", () => {
    expect(pruneTourTypeByHotelId({
      "101": "package",
      "202": "hotel"
    }, [
      { hotel: { id: "101" } }
    ])).toEqual({
      "101": "package"
    });

    expect(setNextHotelTourType({}, "101", "hotel")).toEqual({
      "101": "hotel"
    });
  });
});
