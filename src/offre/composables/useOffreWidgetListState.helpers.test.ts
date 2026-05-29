import { describe, expect, it } from "vitest";
import {
  isOffreViewMode,
  paginateProducts,
  pruneTourTypeByHotelId,
  resolveTotalItems,
  resolveViewModeStorageKey,
  setNextHotelTourType
} from "@/offre/composables/useOffreWidgetListState.helpers";

describe("useOffreWidgetListState helpers", () => {
  it("validates and resolves view mode storage keys", () => {
    expect(isOffreViewMode("list")).toBe(true);
    expect(isOffreViewMode("grid")).toBe(false);
    expect(resolveViewModeStorageKey(" widget-1 ")).toBe("offre-widget:view-mode:widget-1");
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
