import { computed, ref } from "vue";
import { describe, expect, it, vi } from "vitest";
import { useOffreProductsDataState } from "@/offre/composables/useOffreProductsDataState";

const mocks = vi.hoisted(() => {
  function manualRef<T>(initial: T) {
    let current = initial;

    return {
      __v_isRef: true as const,
      get value() {
        return current;
      },
      set value(next: T) {
        current = next;
      }
    };
  }

  return {
    manualRef,
    cacheParams: null as unknown,
    queryParams: null as unknown,
    shouldFetchRegionProducts: manualRef(true),
    regionProductsSource: manualRef([]),
    mapProductsSource: manualRef([]),
    productReferenceSource: manualRef({}),
    effectiveRequestState: manualRef("idle"),
    effectiveProductsError: manualRef(false),
    effectiveNoMatchedProducts: manualRef(false),
    productsList: manualRef([{ hotel: { id: "101" } }]),
    productReference: manualRef({ meals: { ai: { name: "AI" } } }),
    requestState: manualRef("success"),
    productsError: manualRef(false),
    noMatchedProducts: manualRef(false),
    queriedHotelIds: manualRef(["101"]),
    productsFetching: manualRef(false),
    productsPartial: manualRef(false),
    productsInitialLoading: manualRef(false),
    productsRefetching: manualRef(false),
    productsLoading: manualRef(0)
  };
});

vi.mock("@/offre/composables/useOffreProductsCacheState", () => ({
  useOffreProductsCacheState: (params: unknown) => {
    mocks.cacheParams = params;

    return {
      regionProductsSource: mocks.regionProductsSource,
      mapProductsSource: mocks.mapProductsSource,
      productReferenceSource: mocks.productReferenceSource,
      effectiveRequestState: mocks.effectiveRequestState,
      effectiveProductsError: mocks.effectiveProductsError,
      effectiveNoMatchedProducts: mocks.effectiveNoMatchedProducts,
      shouldFetchRegionProducts: mocks.shouldFetchRegionProducts,
      hasBootstrappedActiveRegion: mocks.manualRef(false)
    };
  }
}));

vi.mock("@/offre/composables/useOffreProductsQuery", () => ({
  useOffreProductsQuery: (params: unknown) => {
    mocks.queryParams = params;

    return {
      productsQuery: {},
      refetchProducts: vi.fn(),
      productsList: mocks.productsList,
      productReference: mocks.productReference,
      requestState: mocks.requestState,
      productsError: mocks.productsError,
      noMatchedProducts: mocks.noMatchedProducts,
      queriedHotelIds: mocks.queriedHotelIds,
      productsFetching: mocks.productsFetching,
      productsPartial: mocks.productsPartial,
      productsInitialLoading: mocks.productsInitialLoading,
      productsRefetching: mocks.productsRefetching,
      productsLoading: mocks.productsLoading
    };
  }
}));

describe("useOffreProductsDataState", () => {
  it("connects cache enabled state to products query and exposes query data to cache sources", () => {
    const state = useOffreProductsDataState({
      activeRegionIdSource: ref("region-a"),
      matchedHotelsSource: ref([{ id: "101", onlyhotel: false, usps: [], timeframes: [] }]),
      visibleMatchedHotelsSource: ref([{ id: "101", onlyhotel: false, usps: [], timeframes: [] }]),
      optionsSource: ref({
        groupBy: "regions",
        chartersOnly: false,
        pricing: "default",
        theme: "default",
        timeframe: { fluid: ["P14D", "P115D"], monthly: true },
        nights: [7],
        regionsOrder: [],
        sortBy: "price"
      }),
      hotelInfoByIdSource: ref(new Map()),
      selectedTimeframeSource: ref("June"),
      selectedDepartureSource: ref(null),
      hotelOrderByIdSource: ref(new Map([["101", 0]])),
      currentPageSource: ref(1),
      pageSizeSource: computed(() => 5),
      serverPageModeSource: ref(true),
      resetSignalSource: ref(0)
    });

    const queryParams = mocks.queryParams as { enabledSource: unknown };
    const cacheParams = mocks.cacheParams as {
      productsListSource: () => unknown;
      productReferenceSource: () => unknown;
      requestStateSource: () => unknown;
      queriedHotelIdsSource: () => unknown;
    };

    expect(queryParams.enabledSource).toBe(mocks.shouldFetchRegionProducts);
    expect(cacheParams.productsListSource()).toEqual([{ hotel: { id: "101" } }]);
    expect(cacheParams.productReferenceSource()).toEqual({ meals: { ai: { name: "AI" } } });
    expect(cacheParams.requestStateSource()).toBe("success");
    expect(cacheParams.queriedHotelIdsSource()).toEqual(["101"]);
    expect(state.productsList.value).toEqual([{ hotel: { id: "101" } }]);
    expect(state.shouldFetchRegionProducts.value).toBe(true);
  });
});
