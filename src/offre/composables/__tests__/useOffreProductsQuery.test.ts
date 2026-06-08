import { computed, ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useOffreProductsQuery } from "@/offre/composables/useOffreProductsQuery";
import type { OffreHotelRuntimeEntry } from "@/offre/types";
import type { OffreProductsBatchResult } from "@/offre/api";

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
    queryOptions: null as unknown,
    descriptorsArgs: null as unknown,
    data: manualRef<OffreProductsBatchResult | undefined>(undefined),
    isPending: manualRef(false),
    isError: manualRef(false),
    isFetching: manualRef(false),
    isRefetching: manualRef(false),
    refetch: vi.fn()
  };
});

vi.mock("@tanstack/vue-query", () => ({
  keepPreviousData: Symbol("keepPreviousData"),
  useQuery: (options: unknown) => {
    mocks.queryOptions = options;

    return {
      data: mocks.data,
      isPending: mocks.isPending,
      isError: mocks.isError,
      isFetching: mocks.isFetching,
      isRefetching: mocks.isRefetching,
      refetch: mocks.refetch
    };
  }
}));

vi.mock("@/offre/lib/search-criterias", () => ({
  buildOffreProductQueries: (params: { hotels: Array<{ id: string | number }> }) => {
    mocks.descriptorsArgs = params;

    return params.hotels.map((hotel) => ({
      onlyhotel: false,
      hotels: [{
        hotelId: String(hotel.id),
        arrivalLocation: { id: "arrival", type: 7 }
      }],
      searchCriterias: {
        datePickerMode: 0,
        roomCriterias: [{ passengers: [{ age: 20, passengerType: 0 }] }],
        reservationType: 1,
        imageSizes: [4, 7],
        beginDates: ["2026-06-01", "2026-06-30"],
        nights: [{ value: 7 }],
        departureLocations: [{ id: "2671-5", type: 5, name: "Москва" }],
        arrivalLocations: [{ id: "arrival", type: 7 }],
        paging: { pageNumber: 1, pageSize: 1, sortType: 0 },
        flightType: 2,
        additionalFilters: []
      }
    }));
  }
}));

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

function createQueryState() {
  const hotels = ref([
    createHotel("101"),
    createHotel("202"),
    createHotel("303")
  ]);

  const currentPage = ref(1);
  const pageSize = ref(2);
  const enabled = ref(true);

  const state = useOffreProductsQuery({
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
    hotelsSource: hotels,
    hotelInfoByIdSource: ref(new Map()),
    selectedTimeframeSource: ref("June"),
    selectedDepartureSource: ref({
      id: "2671-5",
      type: 5,
      name: "Москва"
    }),
    hotelOrderByIdSource: ref(new Map([
      ["101", 0],
      ["202", 1],
      ["303", 2]
    ])),
    enabledSource: enabled,
    currentPageSource: currentPage,
    pageSizeSource: computed(() => pageSize.value),
    serverPageModeSource: ref(true)
  });

  return {
    state,
    hotels,
    currentPage,
    pageSize,
    enabled
  };
}

describe("useOffreProductsQuery", () => {
  beforeEach(() => {
    mocks.queryOptions = null;
    mocks.descriptorsArgs = null;
    mocks.data.value = undefined;
    mocks.isPending.value = false;
    mocks.isError.value = false;
    mocks.isFetching.value = false;
    mocks.isRefetching.value = false;
    mocks.refetch.mockReset();
  });

  it("limits queried hotels in server page mode and wires query enablement", () => {
    const { state, enabled } = createQueryState();
    const queryOptions = mocks.queryOptions as {
      enabled: { value: boolean };
      queryKey: { value: unknown };
    };

    expect(queryOptions.enabled.value).toBe(true);
    expect((mocks.descriptorsArgs as { hotels: Array<{ id: string }> }).hotels.map((hotel) => hotel.id)).toEqual([
      "101",
      "202"
    ]);
    expect(state.queriedHotelIds.value).toEqual(["101", "202"]);
    expect(queryOptions.queryKey.value).toBeTruthy();

    enabled.value = false;

    expect(queryOptions.enabled.value).toBe(false);
    expect(state.requestState.value).toBe("idle");
  });

  it("exposes loading state before data arrives", () => {
    mocks.data.value = undefined;
    mocks.isPending.value = true;
    mocks.isError.value = false;
    mocks.isFetching.value = true;
    mocks.isRefetching.value = false;

    const { state } = createQueryState();

    expect(state.productsInitialLoading.value).toBe(true);
    expect(state.requestState.value).toBe("loading");
    expect(state.productsLoading.value).toBe(100);
    expect(state.noMatchedProducts.value).toBe(false);
  });

  it("derives partial state without misclassifying it as no-match", () => {
    mocks.isPending.value = false;
    mocks.isFetching.value = false;
    mocks.isRefetching.value = true;
    mocks.isError.value = false;
    mocks.data.value = {
      payload: {
        products: [],
        reference: {}
      },
      meta: {
        requestState: "partial",
        failedQueries: 1,
        queryCount: 2
      }
    };

    const { state } = createQueryState();

    expect(state.requestState.value).toBe("partial");
    expect(state.productsPartial.value).toBe(true);
    expect(state.noMatchedProducts.value).toBe(false);
    expect(state.productsError.value).toBe(false);
    expect(state.productsRefetching.value).toBe(true);
  });

  it("surfaces error state when vue-query reports a request error", () => {
    mocks.isError.value = true;
    mocks.data.value = undefined;
    mocks.isPending.value = false;

    const { state } = createQueryState();

    expect(state.requestState.value).toBe("error");
    expect(state.productsError.value).toBe(true);
  });
});
