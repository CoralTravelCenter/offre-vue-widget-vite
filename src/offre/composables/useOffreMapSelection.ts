import { computed, nextTick, ref, toValue, type MaybeRefOrGetter, watch } from "vue";
import type { OffreMapSearchPoint } from "offre/components/results/offre-map.types";

export function useOffreMapSelection(params: {
  map: MaybeRefOrGetter<any>;
  mapPointsByHotelId: MaybeRefOrGetter<Map<string, OffreMapSearchPoint>>;
  filteredMapPointsByHotelId: MaybeRefOrGetter<Map<string, OffreMapSearchPoint>>;
  filteredHotelIds: MaybeRefOrGetter<Set<string>>;
  setLastAutoLocationKey: (value: string) => void;
}) {
  const map = computed(() => toValue(params.map));
  const mapPointsByHotelId = computed(() => toValue(params.mapPointsByHotelId));
  const filteredMapPointsByHotelId = computed(() => toValue(params.filteredMapPointsByHotelId));
  const filteredHotelIds = computed(() => toValue(params.filteredHotelIds));

  const activeHotelId = ref<string | null>(null);
  const popupHotelId = ref<string | null>(null);

  const activeMapPoint = computed(() => {
    if (!popupHotelId.value) {
      return null;
    }

    return filteredMapPointsByHotelId.value.get(popupHotelId.value)
      ?? mapPointsByHotelId.value.get(popupHotelId.value)
      ?? null;
  });

  watch(filteredHotelIds, (nextHotelIds) => {
    if (activeHotelId.value && !nextHotelIds.has(activeHotelId.value)) {
      activeHotelId.value = null;
    }

    if (popupHotelId.value && !nextHotelIds.has(popupHotelId.value)) {
      popupHotelId.value = null;
    }
  });

  function focusPoint(hotelId: string) {
    const point = filteredMapPointsByHotelId.value.get(hotelId)
      ?? mapPointsByHotelId.value.get(hotelId);

    if (!point) {
      return null;
    }

    activeHotelId.value = point.hotelId;

    if (map.value) {
      params.setLastAutoLocationKey(`focus:${hotelId}`);
      map.value.setLocation({
        center: [point.longitude, point.latitude],
        duration: 500
      });
    }

    return point;
  }

  async function openPopupForHotel(hotelId: string) {
    popupHotelId.value = null;

    await nextTick();
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });

    if (activeHotelId.value !== hotelId) {
      return;
    }

    popupHotelId.value = hotelId;
  }

  async function selectPoint(hotelId: string) {
    const point = focusPoint(hotelId);

    if (!point) {
      return;
    }

    await openPopupForHotel(hotelId);
  }

  function handleMarkerToggle(hotelId: string) {
    if (activeHotelId.value === hotelId) {
      popupHotelId.value = null;
      activeHotelId.value = null;
      return;
    }

    void selectPoint(hotelId);
  }

  function closeOverlay() {
    popupHotelId.value = null;
    activeHotelId.value = null;
  }

  return {
    activeHotelId,
    popupHotelId,
    activeMapPoint,
    focusPoint,
    selectPoint,
    handleMarkerToggle,
    closeOverlay
  };
}
