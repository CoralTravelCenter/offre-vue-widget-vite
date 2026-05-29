import { describe, expect, it } from "vitest";
import {
  buildAdditionalFilters,
  createArrivalLocationKey,
  toArrivalLocationCriteria
} from "@/offre/lib/search-criterias-helpers";
import { normalizeWidgetOptions } from "@/offre/lib/payload-options";

describe("search-criterias-helpers", () => {
  it("builds an arrival location key", () => {
    expect(createArrivalLocationKey({ id: "123", type: 7 })).toBe("7:123");
  });

  it("creates max-price additional filters only for positive numeric values", () => {
    expect(buildAdditionalFilters(normalizeWidgetOptions({
      maxPrice: "150000"
    }))).toEqual([{
      type: 15,
      values: [{ id: "", value: "0-150000" }],
      providers: []
    }]);

    expect(buildAdditionalFilters(normalizeWidgetOptions({
      maxPrice: "bad"
    }))).toEqual([]);
  });

  it("maps hotel info into arrival location criteria when location is present", () => {
    expect(toArrivalLocationCriteria({
      id: "101",
      location: {
        id: "shared-location",
        type: 7,
        name: "Shared Atoll"
      }
    })).toEqual({
      id: "shared-location",
      type: 7
    });

    expect(toArrivalLocationCriteria({ id: "101" })).toBeNull();
  });
});
