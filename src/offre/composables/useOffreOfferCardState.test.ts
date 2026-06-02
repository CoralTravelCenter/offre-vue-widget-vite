import { computed, ref } from "vue";
import { describe, expect, it, vi } from "vitest";
import { useOffreOfferCardState } from "@/offre/composables/useOffreOfferCardState";
import type { B2COffer, B2CProduct } from "@/offre/api";
import type { OffreTourType } from "@/offre/types";

const hotelOfferMocks = vi.hoisted(() => {
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
    hotelOffer: manualRef<B2COffer | null>(null),
    isPending: manualRef(false)
  };
});

vi.mock("@/offre/composables/useHotelOfferQuery", () => ({
  useHotelOfferQuery: () => ({
    hotelOffer: hotelOfferMocks.hotelOffer,
    hotelOfferQuery: {
      isPending: hotelOfferMocks.isPending
    }
  })
}));

function createProduct(): B2CProduct {
  return {
    hotel: {
      id: 10,
      name: "Hotel Alpha",
      categoryKey: "5",
      eliteHotel: true,
      coralFamilyClub: true
    },
    offers: [{
      price: { amount: 120000 },
      stayNights: 7,
      rooms: [{ passengers: [{ passengerType: 0, age: 20 }] }]
    }]
  };
}

function createState(tourType = ref<OffreTourType>("package")) {
  const selectedTourType = computed<OffreTourType>({
    get: () => tourType.value,
    set: (value) => {
      tourType.value = value;
    }
  });

  return useOffreOfferCardState({
    productSource: ref(createProduct()),
    productReferenceSource: ref({
      hotelCategories: {
        5: { name: "5 звезд", starCount: 5 }
      }
    }),
    selectedDepartureNameSource: ref("Москва"),
    pricingModeSource: ref("default"),
    searchOptionsSource: ref({
      groupBy: "regions",
      chartersOnly: false,
      pricing: "default",
      theme: "default",
      timeframe: { fluid: ["P14D", "P115D"], monthly: true },
      nights: [7],
      regionsOrder: [],
      sortBy: "price"
    }),
    hotelRuntimeEntrySource: ref({
      id: 10,
      onlyhotel: false,
      usps: ["Первая линия"],
      timeframes: []
    }),
    selectedTourTypeRef: selectedTourType,
    brandKeySource: ref("coral")
  });
}

describe("useOffreOfferCardState", () => {
  it("uses package offer by default and exposes labels", () => {
    hotelOfferMocks.hotelOffer.value = null;
    hotelOfferMocks.isPending.value = false;

    const state = createState();

    expect(state.effectiveOffer.value).toBe(state.baseOffer.value);
    expect(state.hotelOfferLoading.value).toBe(false);
    expect(state.starItems.value).toHaveLength(5);
    expect(state.hasLabels.value).toBe(true);
    expect(state.hasUsps.value).toBe(true);
  });

  it("uses hotel offer and loading state in hotel tour mode", () => {
    const tourType = ref<OffreTourType>("hotel");
    const hotelOffer = {
      price: { amount: 90000 },
      stayNights: 5,
      rooms: [{ passengers: [{ passengerType: 0, age: 20 }] }]
    };
    hotelOfferMocks.hotelOffer.value = hotelOffer;
    hotelOfferMocks.isPending.value = true;

    const state = createState(tourType);

    expect(state.effectiveOffer.value).toBe(hotelOffer);
    expect(state.hotelOfferLoading.value).toBe(true);
  });
});
