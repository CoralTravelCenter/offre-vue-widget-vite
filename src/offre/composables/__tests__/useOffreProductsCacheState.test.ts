import { computed, nextTick, ref } from "vue";
import { describe, expect, it } from "vitest";
import { useOffreProductsCacheState } from "@/offre/composables/useOffreProductsCacheState";
import type { B2CPriceSearchReference, B2CProduct } from "@/offre/api";
import type { OffreHotelRuntimeEntry, OffreRequestState } from "@/offre/types";

function createHotel(id: string): OffreHotelRuntimeEntry {
  return {
    id,
    onlyhotel: false,
    usps: [],
    timeframes: [{
      key: "jun",
      searchFields: {
        beginDates: ["2026-06-01", "2026-06-30"],
        nights: [7]
      }
    }]
  };
}

function createProduct(id: string, amount: number): B2CProduct {
  return {
    hotel: { id, name: `Hotel ${id}` },
    offers: [{
      price: {
        amount
      }
    }]
  };
}

describe("useOffreProductsCacheState", () => {
  it("merges fetched products into cache and exposes region and map slices", async () => {
    const activeRegionId = ref("region-a");
    const matchedHotels = ref([createHotel("101"), createHotel("202")]);
    const visibleMatchedHotels = ref([createHotel("101")]);
    const productsList = ref<B2CProduct[]>([]);
    const productReference = ref<B2CPriceSearchReference>({});
    const requestState = ref<OffreRequestState>("idle");
    const productsError = ref(false);
    const noMatchedProducts = ref(false);
    const queriedHotelIds = ref<string[]>([]);
    const productsFetching = ref(false);
    const resetSignal = ref(0);

    const state = useOffreProductsCacheState({
      activeRegionIdSource: activeRegionId,
      matchedHotelsSource: matchedHotels,
      visibleMatchedHotelsSource: visibleMatchedHotels,
      productsListSource: productsList,
      productReferenceSource: productReference,
      requestStateSource: requestState,
      productsErrorSource: productsError,
      noMatchedProductsSource: noMatchedProducts,
      queriedHotelIdsSource: queriedHotelIds,
      productsFetchingSource: productsFetching,
      isListPageModeSource: computed(() => true),
      resetSignalSource: resetSignal
    });

    productsList.value = [createProduct("101", 500), createProduct("202", 700)];
    productReference.value = { meals: { ai: { name: "AI" } } };
    requestState.value = "success";
    queriedHotelIds.value = ["101", "202"];
    await nextTick();

    expect(state.regionProductsSource.value).toHaveLength(1);
    expect(state.mapProductsSource.value).toHaveLength(2);
    expect(state.productReferenceSource.value.meals).toEqual({ ai: { name: "AI" } });
    expect(state.shouldFetchRegionProducts.value).toBe(true);

    productsFetching.value = true;
    await nextTick();
    productsFetching.value = false;
    await nextTick();

    expect(state.shouldFetchRegionProducts.value).toBe(false);
    expect(state.hasBootstrappedActiveRegion.value).toBe(true);
  });

  it("falls back to cached regional outcome when live request state is idle", async () => {
    const activeRegionId = ref("region-a");
    const matchedHotels = ref([createHotel("101")]);
    const visibleMatchedHotels = ref([createHotel("101")]);
    const requestState = ref<OffreRequestState>("success");
    const productsError = ref(false);
    const noMatchedProducts = ref(true);

    const state = useOffreProductsCacheState({
      activeRegionIdSource: activeRegionId,
      matchedHotelsSource: matchedHotels,
      visibleMatchedHotelsSource: visibleMatchedHotels,
      productsListSource: computed(() => []),
      productReferenceSource: computed(() => ({})),
      requestStateSource: requestState,
      productsErrorSource: productsError,
      noMatchedProductsSource: noMatchedProducts,
      queriedHotelIdsSource: computed(() => []),
      productsFetchingSource: computed(() => false),
      isListPageModeSource: computed(() => true)
    });

    await nextTick();

    requestState.value = "idle";
    noMatchedProducts.value = false;
    await nextTick();

    expect(state.effectiveRequestState.value).toBe("success");
    expect(state.effectiveNoMatchedProducts.value).toBe(true);
    expect(state.effectiveProductsError.value).toBe(false);
  });
});
