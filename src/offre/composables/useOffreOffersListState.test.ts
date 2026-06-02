import { describe, expect, it } from "vitest";
import { ref } from "vue";
import { useOffreOffersListState } from "@/offre/composables/useOffreOffersListState";
import type { B2CProduct } from "@/offre/api";
import type { OffreHotelRuntimeEntry, OffreTourType } from "@/offre/types";

function createProduct(id: string, name = `Hotel ${id}`): B2CProduct {
  return {
    hotel: { id, name },
    offers: []
  };
}

function createRuntimeEntry(id: string): OffreHotelRuntimeEntry {
  return {
    id,
    onlyhotel: false,
    usps: [],
    timeframes: []
  };
}

describe("useOffreOffersListState", () => {
  it("builds list entry view models with runtime and tour type", () => {
    const runtimeEntry = createRuntimeEntry("101");
    const state = useOffreOffersListState({
      productsSource: ref([createProduct("101")]),
      hotelRuntimeByIdSource: ref(new Map([["101", runtimeEntry]])),
      tourTypeByHotelIdSource: ref<Record<string, OffreTourType>>({
        101: "hotel"
      })
    });

    expect(state.normalizedProducts.value).toEqual([{
      key: "101",
      hotelId: "101",
      product: createProduct("101"),
      hotelRuntimeEntry: runtimeEntry,
      tourType: "hotel"
    }]);
  });

  it("uses fallback key when product has no hotel id", () => {
    const product: B2CProduct = {
      hotel: { name: "No Id Hotel" },
      offers: []
    };
    const state = useOffreOffersListState({
      productsSource: ref([product]),
      hotelRuntimeByIdSource: ref(new Map()),
      tourTypeByHotelIdSource: ref({})
    });

    expect(state.normalizedProducts.value[0]).toMatchObject({
      key: "No Id Hotel",
      hotelId: "",
      hotelRuntimeEntry: null,
      tourType: undefined
    });
  });
});
