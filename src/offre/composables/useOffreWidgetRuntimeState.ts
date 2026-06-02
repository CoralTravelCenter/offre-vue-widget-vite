import { computed, toValue, type MaybeRefOrGetter, type Ref } from "vue";
import type { OffreHotelRuntimeEntry, OffreViewMode } from "@/offre/types";

export function useOffreWidgetRuntimeState(params: {
  matchedHotelsSource: MaybeRefOrGetter<OffreHotelRuntimeEntry[]>;
  viewModeRef: Ref<OffreViewMode>;
  currentPageRef: Ref<number>;
  pageSize: number;
}) {
  const matchedHotels = computed(() => toValue(params.matchedHotelsSource));

  const hotelRuntimeById = computed(() => {
    return matchedHotels.value.reduce<Map<string, OffreHotelRuntimeEntry>>((accumulator, hotel) => {
      accumulator.set(String(hotel.id), hotel);
      return accumulator;
    }, new Map<string, OffreHotelRuntimeEntry>());
  });

  const isListPageMode = computed(() => {
    return params.viewModeRef.value === "list";
  });

  const visibleMatchedHotels = computed(() => {
    if (!isListPageMode.value) {
      return matchedHotels.value;
    }

    return matchedHotels.value.slice(0, params.currentPageRef.value * params.pageSize);
  });

  return {
    hotelRuntimeById,
    isListPageMode,
    visibleMatchedHotels
  };
}
