import { computed, toValue, type MaybeRefOrGetter } from "vue";
import type { B2COffer, B2CPriceSearchReference, B2CProduct } from "@/offre/api";
import { useOffreOfferTerms } from "@/offre/composables/useOffreOfferTerms";
import {
  buildBaseMapPoints,
  buildHotelIdSet,
  buildMapSearchPoints,
  buildPointsByHotelId,
  getMapReferenceValue,
  normalizeMapSearchValue,
  type OffreMapOverlayModel,
  type OffreMapSearchPoint
} from "@/offre/lib/offre-map";

export function useOffreMapViewState(params: {
  visibleProductsSource: MaybeRefOrGetter<B2CProduct[]>;
  hotelOffersByHotelIdSource: MaybeRefOrGetter<Map<string, B2COffer | null>>;
  mapOfferModeSource: MaybeRefOrGetter<"package" | "hotel">;
  pricingModeSource?: MaybeRefOrGetter<unknown>;
  hostnameSource: MaybeRefOrGetter<string>;
  hotelSearchQuerySource: MaybeRefOrGetter<string>;
  activeMapPointSource: MaybeRefOrGetter<OffreMapSearchPoint | null>;
  productReferenceSource: MaybeRefOrGetter<B2CPriceSearchReference>;
  selectedDepartureNameSource: MaybeRefOrGetter<string>;
}) {
  const baseMapPoints = computed(() => {
    return buildBaseMapPoints(toValue(params.visibleProductsSource));
  });

  const visibleMapPoints = computed<OffreMapSearchPoint[]>(() => {
    return buildMapSearchPoints({
      points: baseMapPoints.value,
      hotelOffersByHotelId: toValue(params.hotelOffersByHotelIdSource),
      mapOfferMode: toValue(params.mapOfferModeSource),
      pricingMode: toValue(params.pricingModeSource),
      hostname: toValue(params.hostnameSource)
    });
  });

  const sortedVisibleMapPoints = computed(() => {
    return [...visibleMapPoints.value].sort((left, right) => {
      return left.hotelName.localeCompare(right.hotelName, "ru-RU");
    });
  });

  const searchFilteredMapPoints = computed(() => {
    const searchValue = normalizeMapSearchValue(toValue(params.hotelSearchQuerySource));

    if (!searchValue) {
      return sortedVisibleMapPoints.value;
    }

    return sortedVisibleMapPoints.value.filter((point) => {
      return normalizeMapSearchValue(point.hotelName).includes(searchValue);
    });
  });

  const visibleMapPointsByHotelId = computed(() => {
    return buildPointsByHotelId(visibleMapPoints.value);
  });

  const searchFilteredMapPointsByHotelId = computed(() => {
    return buildPointsByHotelId(searchFilteredMapPoints.value);
  });

  const searchFilteredHotelIds = computed(() => {
    return buildHotelIdSet(searchFilteredMapPoints.value);
  });

  const activeMapPointHotelStarCount = computed(() => {
    const hotelCategory = getMapReferenceValue<{ starCount?: number }>(
      toValue(params.productReferenceSource),
      "hotelCategories",
      toValue(params.activeMapPointSource)?.categoryKey
    );

    return Number(hotelCategory?.starCount) || 0;
  });

  const activeMapPointStarItems = computed<boolean[]>(() => {
    return Array.from({ length: activeMapPointHotelStarCount.value }, () => true);
  });

  const {
    terms: activeMapPointTerms
  } = useOffreOfferTerms({
    offer: () => toValue(params.activeMapPointSource)?.effectiveOffer ?? null,
    productReference: params.productReferenceSource,
    selectedDepartureName: params.selectedDepartureNameSource
  });

  const activeMapOverlayModel = computed<OffreMapOverlayModel | null>(() => {
    const activeMapPoint = toValue(params.activeMapPointSource);

    if (!activeMapPoint) {
      return null;
    }

    return {
      point: activeMapPoint,
      terms: activeMapPointTerms.value,
      starItems: activeMapPointStarItems.value
    };
  });

  const overlayBounds = computed<[[number, number], [number, number]] | null>(() => {
    const activeMapPoint = toValue(params.activeMapPointSource);

    if (!activeMapPoint) {
      return null;
    }

    const longitudeDelta = 0.0001;
    const latitudeDelta = 0.0001;

    return [
      [activeMapPoint.longitude - longitudeDelta, activeMapPoint.latitude + latitudeDelta],
      [activeMapPoint.longitude + longitudeDelta, activeMapPoint.latitude - latitudeDelta]
    ];
  });

  const hasBaseMapPoints = computed(() => visibleMapPoints.value.length > 0);

  return {
    baseMapPoints,
    visibleMapPoints,
    sortedVisibleMapPoints,
    searchFilteredMapPoints,
    visibleMapPointsByHotelId,
    searchFilteredMapPointsByHotelId,
    searchFilteredHotelIds,
    activeMapPointHotelStarCount,
    activeMapPointStarItems,
    activeMapOverlayModel,
    overlayBounds,
    hasBaseMapPoints
  };
}
