import { describe, expect, it } from "vitest";
import { ref } from "vue";
import { useOffreWidgetRuntimeState } from "@/offre/composables/useOffreWidgetRuntimeState";
import type { OffreHotelRuntimeEntry, OffreViewMode } from "@/offre/types";

function createHotel(id: string): OffreHotelRuntimeEntry {
  return {
    id,
    onlyhotel: false,
    usps: [],
    timeframes: []
  };
}

describe("useOffreWidgetRuntimeState", () => {
  it("indexes hotels by id and limits visible hotels in list mode", () => {
    const matchedHotels = ref([
      createHotel("10"),
      createHotel("20"),
      createHotel("30")
    ]);
    const viewMode = ref<OffreViewMode>("list");
    const currentPage = ref(1);

    const state = useOffreWidgetRuntimeState({
      matchedHotelsSource: matchedHotels,
      viewModeRef: viewMode,
      currentPageRef: currentPage,
      pageSize: 2
    });

    expect(state.hotelRuntimeById.value.get("20")).toBe(matchedHotels.value[1]);
    expect(state.visibleMatchedHotels.value.map((hotel) => hotel.id)).toEqual(["10", "20"]);

    currentPage.value = 2;
    expect(state.visibleMatchedHotels.value.map((hotel) => hotel.id)).toEqual(["10", "20", "30"]);
  });

  it("keeps all matched hotels visible in map mode", () => {
    const matchedHotels = ref([
      createHotel("10"),
      createHotel("20"),
      createHotel("30")
    ]);
    const viewMode = ref<OffreViewMode>("map");
    const currentPage = ref(1);

    const state = useOffreWidgetRuntimeState({
      matchedHotelsSource: matchedHotels,
      viewModeRef: viewMode,
      currentPageRef: currentPage,
      pageSize: 2
    });

    expect(state.isListPageMode.value).toBe(false);
    expect(state.visibleMatchedHotels.value.map((hotel) => hotel.id)).toEqual(["10", "20", "30"]);
  });
});
