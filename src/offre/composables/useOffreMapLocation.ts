import { computed, ref, toValue, type MaybeRefOrGetter, watch } from "vue";
import { buildMapPointsLocationKey } from "offre/lib/offre-map";
import { getBoundsFromCoords, getLocationFromBounds } from "vue-yandex-maps";

interface MapLocationPoint {
  hotelId: string;
  longitude: number;
  latitude: number;
}

export function useOffreMapLocation(params: {
  ymapsInitialized: MaybeRefOrGetter<boolean>;
  map: MaybeRefOrGetter<any>;
  points: MaybeRefOrGetter<MapLocationPoint[]>;
  activeHotelId: MaybeRefOrGetter<string | null>;
  mapSettings: {
    location: {
      center: [number, number];
      zoom: number;
    };
  };
}) {
  const ymapsInitialized = computed(() => toValue(params.ymapsInitialized));
  const map = computed(() => toValue(params.map));
  const points = computed(() => toValue(params.points));
  const activeHotelId = computed(() => toValue(params.activeHotelId));
  const lastAutoLocationKey = ref("");

  watch([points, map], async ([nextPoints, nextMap], _prev, onCleanup) => {
    let cancelled = false;
    onCleanup(() => {
      cancelled = true;
    });

    if (!ymapsInitialized.value || !nextMap || nextPoints.length === 0) {
      return;
    }

    if (activeHotelId.value && nextPoints.some((point) => point.hotelId === activeHotelId.value)) {
      return;
    }

    if (nextPoints.length === 1) {
      const nextLocationKey = `single:${nextPoints[0].hotelId}`;

      if (lastAutoLocationKey.value === nextLocationKey) {
        return;
      }

      lastAutoLocationKey.value = nextLocationKey;
      params.mapSettings.location = {
        center: [nextPoints[0].longitude, nextPoints[0].latitude],
        zoom: 10
      };
      return;
    }

    const nextLocationKey = `bounds:${buildMapPointsLocationKey(nextPoints)}`;

    if (lastAutoLocationKey.value === nextLocationKey) {
      return;
    }

    const nextLocation = await getLocationFromBounds({
      bounds: getBoundsFromCoords(nextPoints.map((point) => [point.longitude, point.latitude])),
      map: nextMap,
      roundZoom: true,
      comfortZoomLevel: true
    });

    if (cancelled || !map.value) {
      return;
    }

    lastAutoLocationKey.value = nextLocationKey;
    map.value.setLocation({
      ...nextLocation,
      duration: 750
    });
  }, { immediate: true });

  return {
    lastAutoLocationKey
  };
}
