import { describe, expect, it } from "vitest";
import { computed, ref } from "vue";
import { useOffreMapViewState } from "@/offre/composables/useOffreMapViewState";
import type { B2CPriceSearchReference, B2CProduct } from "@/offre/api";
import type { OffreMapSearchPoint } from "@/offre/lib/offre-map";

function createProduct(id: number, name: string): B2CProduct {
  return {
    hotel: {
      id,
      name,
      categoryKey: "5",
      coordinates: {
        latitude: "27.2",
        longitude: "33.8"
      }
    },
    offers: [{
      price: { amount: 120000 },
      stayNights: 7,
      rooms: [{ passengers: [{ passengerType: 0, age: 20 }] }]
    }]
  };
}

function createState(overrides: {
  visibleProducts?: B2CProduct[];
  hotelSearchQuery?: string;
  activeMapPoint?: OffreMapSearchPoint | null;
  productReference?: B2CPriceSearchReference;
  loadingHotelIds?: Set<string>;
  mapOfferMode?: "package" | "hotel";
} = {}) {
  return useOffreMapViewState({
    visibleProductsSource: ref(overrides.visibleProducts ?? []),
    hotelOffersByHotelIdSource: ref(new Map()),
    loadingHotelIdsSource: ref(overrides.loadingHotelIds ?? new Set()),
    mapOfferModeSource: ref(overrides.mapOfferMode ?? "package"),
    pricingModeSource: ref("default"),
    hostnameSource: ref("example.com"),
    hotelSearchQuerySource: ref(overrides.hotelSearchQuery ?? ""),
    activeMapPointSource: computed(() => overrides.activeMapPoint ?? null),
    productReferenceSource: ref(overrides.productReference ?? {}),
    selectedDepartureNameSource: ref("Москва")
  });
}

describe("useOffreMapViewState", () => {
  it("sorts and filters visible map points by normalized hotel search", () => {
    const state = createState({
      visibleProducts: [
        createProduct(10, "Бета Резорт"),
        createProduct(20, "Альфа Отель")
      ],
      hotelSearchQuery: "альфа"
    });

    expect(state.sortedVisibleMapPoints.value.map((point) => point.hotelName)).toEqual([
      "Альфа Отель",
      "Бета Резорт"
    ]);
    expect(state.searchFilteredMapPoints.value.map((point) => point.hotelId)).toEqual(["20"]);
    expect(state.searchFilteredHotelIds.value.has("20")).toBe(true);
  });

  it("builds active overlay model with stars from reference", () => {
    const baseState = createState({
      visibleProducts: [createProduct(10, "Альфа Отель")]
    });
    const activeMapPoint = baseState.visibleMapPoints.value[0] ?? null;
    const state = createState({
      activeMapPoint,
      productReference: {
        hotelCategories: {
          5: { starCount: 5 }
        }
      }
    });

    expect(state.activeMapPointHotelStarCount.value).toBe(5);
    expect(state.activeMapPointStarItems.value).toHaveLength(5);
    expect(state.activeMapOverlayModel.value?.point.hotelId).toBe("10");
  });

  it("builds overlay bounds around active point", () => {
    const baseState = createState({
      visibleProducts: [createProduct(10, "Альфа Отель")]
    });
    const activeMapPoint = baseState.visibleMapPoints.value[0] ?? null;
    const state = createState({ activeMapPoint });

    expect(state.overlayBounds.value?.[0]?.[0]).toBeCloseTo(33.7999);
    expect(state.overlayBounds.value?.[0]?.[1]).toBeCloseTo(27.2001);
    expect(state.overlayBounds.value?.[1]?.[0]).toBeCloseTo(33.8001);
    expect(state.overlayBounds.value?.[1]?.[1]).toBeCloseTo(27.1999);
  });

  it("marks hotel-mode points as loading until hotel-specific offers resolve", () => {
    const state = createState({
      visibleProducts: [createProduct(10, "Альфа Отель")],
      mapOfferMode: "hotel",
      loadingHotelIds: new Set(["10"])
    });

    expect(state.visibleMapPoints.value[0]?.isLoadingPrice).toBe(true);
    expect(state.visibleMapPoints.value[0]?.currentPriceLabel).toBe("");
  });
});
