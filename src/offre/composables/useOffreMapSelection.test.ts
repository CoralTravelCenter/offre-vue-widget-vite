import { computed, ref, nextTick } from "vue";
import { describe, expect, it, vi } from "vitest";
import { useOffreMapSelection } from "@/offre/composables/useOffreMapSelection";
import type { OffreMapSearchPoint } from "@/offre/lib/offre-map";

function createPoint(hotelId: string): OffreMapSearchPoint {
  return {
    key: hotelId,
    hotelId,
    hotelName: `Hotel ${hotelId}`,
    locationLabel: "Hurghada",
    imageUrl: "",
    latitude: 27.2,
    longitude: 33.8,
    packageOffer: null,
    isFamilyClub: false,
    isEliteHotel: false,
    effectiveOffer: null,
    currentPriceValue: 0,
    currentPriceLabel: "",
    priceSuffix: "",
    offerHref: ""
  };
}

describe("useOffreMapSelection", () => {
  it("resolves active map point from popup hotel id", async () => {
    const point = createPoint("10");
    const filteredHotelIds = ref(new Set(["10"]));
    const lastAutoLocationKey = ref("");
    const selection = useOffreMapSelection({
      map: ref(null),
      mapPointsByHotelId: computed(() => new Map([["10", point]])),
      filteredMapPointsByHotelId: computed(() => new Map([["10", point]])),
      filteredHotelIds,
      setLastAutoLocationKey(value) {
        lastAutoLocationKey.value = value;
      }
    });

    selection.activeHotelId.value = "10";
    selection.popupHotelId.value = "10";

    expect(selection.activeMapPoint.value).toBe(point);
  });

  it("clears active and popup hotel ids when filtered ids no longer contain them", async () => {
    const point = createPoint("10");
    const filteredHotelIds = ref(new Set(["10"]));
    const lastAutoLocationKey = ref("");
    const selection = useOffreMapSelection({
      map: ref(null),
      mapPointsByHotelId: computed(() => new Map([["10", point]])),
      filteredMapPointsByHotelId: computed(() => new Map([["10", point]])),
      filteredHotelIds,
      setLastAutoLocationKey(value) {
        lastAutoLocationKey.value = value;
      }
    });

    selection.activeHotelId.value = "10";
    selection.popupHotelId.value = "10";
    filteredHotelIds.value = new Set();

    await nextTick();

    expect(selection.activeHotelId.value).toBeNull();
    expect(selection.popupHotelId.value).toBeNull();
  });

  it("focuses selected hotel with explicit zoom and updates auto-location key", () => {
    const point = createPoint("10");
    const setLocation = vi.fn();
    const filteredHotelIds = ref(new Set(["10"]));
    const lastAutoLocationKey = ref("");
    const selection = useOffreMapSelection({
      map: ref({ setLocation }),
      mapPointsByHotelId: computed(() => new Map([["10", point]])),
      filteredMapPointsByHotelId: computed(() => new Map([["10", point]])),
      filteredHotelIds,
      setLastAutoLocationKey(value) {
        lastAutoLocationKey.value = value;
      }
    });

    selection.focusPoint("10");

    expect(selection.activeHotelId.value).toBe("10");
    expect(lastAutoLocationKey.value).toBe("focus:10");
    expect(setLocation).toHaveBeenCalledWith({
      center: [point.longitude, point.latitude],
      zoom: 12,
      duration: 500
    });
  });
});
