import { nextTick, ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { B2COffer, B2CProduct } from "@/offre/api";
import { useOffreMapHotelOffers } from "@/offre/composables/useOffreMapHotelOffers";
import type { NormalizedOffreWidgetOptions } from "@/offre/lib/payload";

const mocks = vi.hoisted(() => {
  const fetchQuery = vi.fn();
  return { fetchQuery };
});

vi.mock("@tanstack/vue-query", () => ({
  useQueryClient: () => ({
    fetchQuery: mocks.fetchQuery
  })
}));

async function flushAsyncState() {
  await nextTick();
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await nextTick();
}

function createSearchOptions(): NormalizedOffreWidgetOptions {
  return {
    groupBy: "regions",
    chartersOnly: false,
    pricing: "default",
    theme: "default",
    timeframe: { fluid: ["P14D", "P115D"], monthly: true },
    nights: [7],
    regionsOrder: [],
    sortBy: "price",
    roomCriterias: [{
      passengers: [
        { age: 20, passengerType: 0 },
        { age: 20, passengerType: 0 }
      ]
    }]
  };
}

function createOffer(): B2COffer {
  return {
    checkInDate: "2026-06-10",
    stayNights: 7,
    price: { amount: 120000 },
    rooms: [{
      passengers: [
        { age: 20, passengerType: 0 },
        { age: 20, passengerType: 0 }
      ]
    }]
  };
}

function createProduct(id: string): B2CProduct {
  return {
    hotel: {
      id,
      name: `Hotel ${id}`,
      location: {
        id: `loc-${id}`,
        type: 7,
        name: `Location ${id}`
      }
    },
    offers: [createOffer()]
  };
}

describe("useOffreMapHotelOffers", () => {
  beforeEach(() => {
    mocks.fetchQuery.mockReset();
  });

  it("stays idle in package mode and clears hotel-specific state", async () => {
    const products = ref([createProduct("101")]);
    const searchOptions = ref(createSearchOptions());

    const state = useOffreMapHotelOffers({
      products,
      searchOptions
    });

    await nextTick();

    expect(state.mapOfferMode.value).toBe("package");
    expect(state.hotelOffersByHotelId.value.size).toBe(0);
    expect(state.loadingHotelIds.value.size).toBe(0);
    expect(state.mapOfferLoading.value).toBe(false);
    expect(mocks.fetchQuery).not.toHaveBeenCalled();
  });

  it("loads hotel offers in hotel mode and stores only successful results", async () => {
    const products = ref([createProduct("101"), createProduct("202")]);
    const searchOptions = ref(createSearchOptions());

    mocks.fetchQuery.mockImplementation(async ({ queryFn, queryKey }) => {
      const key = String(queryKey[2] ?? "");

      if (key.includes("loc-202")) {
        throw new Error("network");
      }

      return createOffer();
    });

    const state = useOffreMapHotelOffers({
      products,
      searchOptions
    });

    state.mapOfferMode.value = "hotel";
    await flushAsyncState();

    expect(mocks.fetchQuery).toHaveBeenCalledTimes(2);
    expect(state.mapOfferLoading.value).toBe(false);
    expect(state.loadingHotelIds.value.size).toBe(0);
    expect(state.hotelOffersByHotelId.value.get("101")).toEqual(createOffer());
    expect(state.hotelOffersByHotelId.value.has("202")).toBe(false);
  });

  it("marks entries without hotel search criterias as resolved null without fetching", async () => {
    const products = ref<B2CProduct[]>([{
      hotel: {
        id: "101",
        name: "Hotel 101"
      },
      offers: []
    }]);
    const searchOptions = ref(createSearchOptions());

    const state = useOffreMapHotelOffers({
      products,
      searchOptions
    });

    state.mapOfferMode.value = "hotel";
    await flushAsyncState();

    expect(mocks.fetchQuery).not.toHaveBeenCalled();
    expect(state.mapOfferLoading.value).toBe(false);
    expect(state.loadingHotelIds.value.size).toBe(0);
    expect(state.hotelOffersByHotelId.value.get("101")).toBeNull();
  });
});
