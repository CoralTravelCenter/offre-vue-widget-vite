import { describe, expect, it } from "vitest";
import type { B2CPriceSearchReference, B2CProduct } from "@/offre/api";
import {
  createHotelIdSet,
  filterProductsByHotelIds,
  mergeBootstrappedRegionIds,
  mergeCachedProducts,
  mergeFetchedHotelIds,
  resolveEffectiveNoMatchedProducts,
  resolveEffectiveProductsError,
  resolveEffectiveRequestState,
  resolveHasBootstrappedActiveRegion,
  resolvePendingRegionBootstrapId,
  resolveRegionOutcome,
  resolveShouldFetchRegionProducts,
  shouldPersistProductReference
} from "@/offre/composables/useOffreProductsCacheState.helpers";
import type { OffreHotelRuntimeEntry } from "@/offre/types";

function createHotel(id: string): OffreHotelRuntimeEntry {
  return {
    id,
    onlyhotel: false,
    usps: [],
    timeframes: []
  };
}

function createProduct(id: string, amount: number): B2CProduct {
  return {
    hotel: { id, name: `Hotel ${id}` },
    offers: [{ price: { amount } }]
  };
}

describe("useOffreProductsCacheState helpers", () => {
  it("filters and merges cached products by hotel id", () => {
    const hotelIds = createHotelIdSet([createHotel("101"), createHotel("202")]);

    expect(filterProductsByHotelIds([
      createProduct("101", 500),
      createProduct("303", 900)
    ], hotelIds)).toHaveLength(1);

    expect(mergeCachedProducts(
      [createProduct("101", 700)],
      [createProduct("101", 500), createProduct("202", 800)]
    )).toMatchObject([
      { hotel: { id: "101" }, offers: [{ price: { amount: 500 } }] },
      { hotel: { id: "202" }, offers: [{ price: { amount: 800 } }] }
    ]);
  });

  it("resolves cache persistence and bootstrap transitions", () => {
    const reference: B2CPriceSearchReference = { meals: { ai: { name: "AI" } } };

    expect(shouldPersistProductReference(reference, [createProduct("101", 500)])).toEqual(reference);
    expect(shouldPersistProductReference(reference, [])).toBeNull();

    expect(mergeFetchedHotelIds([], ["101", "202"], "success", false)).toEqual(["101", "202"]);
    expect(resolvePendingRegionBootstrapId({
      activeRegionId: "region-a",
      shouldFetch: true,
      isFetching: true
    })).toBe("region-a");
    expect(mergeBootstrappedRegionIds([], "region-a", "success", false, ["101"], false)).toEqual(["region-a"]);
    expect(resolveHasBootstrappedActiveRegion("region-a", ["region-a"])).toBe(true);
  });

  it("derives region outcomes and effective request flags", () => {
    const outcome = resolveRegionOutcome("partial", false, true);

    expect(outcome).toEqual({
      requestState: "partial",
      noMatched: true,
      error: false
    });
    expect(resolveShouldFetchRegionProducts({
      matchedHotelsCount: 2,
      isRegionFullyCached: false,
      hasBootstrappedActiveRegion: false
    })).toBe(true);
    expect(resolveEffectiveRequestState("idle", outcome)).toBe("partial");
    expect(resolveEffectiveProductsError(false, outcome)).toBe(false);
    expect(resolveEffectiveNoMatchedProducts(false, outcome)).toBe(true);
  });
});
