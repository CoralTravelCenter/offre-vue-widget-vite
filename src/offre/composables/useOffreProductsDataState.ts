import { computed, shallowRef, type MaybeRefOrGetter } from "vue";
import type { B2CHotelInfo, B2CLocation } from "@/offre/api";
import type { NormalizedOffreWidgetOptions } from "@/offre/lib/payload";
import { useOffreProductsCacheState } from "@/offre/composables/useOffreProductsCacheState";
import { useOffreProductsQuery } from "@/offre/composables/useOffreProductsQuery";
import type { OffreHotelRuntimeEntry } from "@/offre/types";

export function useOffreProductsDataState(params: {
  activeRegionIdSource: MaybeRefOrGetter<string>;
  matchedHotelsSource: MaybeRefOrGetter<OffreHotelRuntimeEntry[]>;
  visibleMatchedHotelsSource: MaybeRefOrGetter<OffreHotelRuntimeEntry[]>;
  optionsSource: MaybeRefOrGetter<NormalizedOffreWidgetOptions>;
  hotelInfoByIdSource: MaybeRefOrGetter<Map<string, B2CHotelInfo>>;
  selectedTimeframeSource: MaybeRefOrGetter<string>;
  selectedDepartureSource: MaybeRefOrGetter<B2CLocation | null>;
  hotelOrderByIdSource: MaybeRefOrGetter<Map<string, number>>;
  currentPageSource: MaybeRefOrGetter<number>;
  pageSizeSource: MaybeRefOrGetter<number>;
  serverPageModeSource: MaybeRefOrGetter<boolean>;
  resetSignalSource?: MaybeRefOrGetter<unknown>;
}) {
  const queryStateRef = shallowRef<ReturnType<typeof useOffreProductsQuery> | null>(null);

  const cacheState = useOffreProductsCacheState({
    activeRegionIdSource: params.activeRegionIdSource,
    matchedHotelsSource: params.matchedHotelsSource,
    visibleMatchedHotelsSource: params.visibleMatchedHotelsSource,
    productsListSource: () => queryStateRef.value?.productsList.value ?? [],
    productReferenceSource: () => queryStateRef.value?.productReference.value ?? {},
    requestStateSource: () => queryStateRef.value?.requestState.value ?? "idle",
    productsErrorSource: () => queryStateRef.value?.productsError.value ?? false,
    noMatchedProductsSource: () => queryStateRef.value?.noMatchedProducts.value ?? false,
    queriedHotelIdsSource: () => queryStateRef.value?.queriedHotelIds.value ?? [],
    productsFetchingSource: () => queryStateRef.value?.productsFetching.value ?? false,
    isListPageModeSource: params.serverPageModeSource,
    resetSignalSource: params.resetSignalSource
  });

  const productsQueryState = useOffreProductsQuery({
    optionsSource: params.optionsSource,
    hotelsSource: params.matchedHotelsSource,
    hotelInfoByIdSource: params.hotelInfoByIdSource,
    selectedTimeframeSource: params.selectedTimeframeSource,
    selectedDepartureSource: params.selectedDepartureSource,
    hotelOrderByIdSource: params.hotelOrderByIdSource,
    enabledSource: cacheState.shouldFetchRegionProducts,
    currentPageSource: params.currentPageSource,
    pageSizeSource: params.pageSizeSource,
    serverPageModeSource: params.serverPageModeSource
  });

  queryStateRef.value = productsQueryState;

  return {
    ...productsQueryState,
    regionProductsSource: cacheState.regionProductsSource,
    mapProductsSource: cacheState.mapProductsSource,
    productReferenceSource: cacheState.productReferenceSource,
    effectiveRequestState: cacheState.effectiveRequestState,
    effectiveProductsError: cacheState.effectiveProductsError,
    effectiveNoMatchedProducts: cacheState.effectiveNoMatchedProducts,
    shouldFetchRegionProducts: cacheState.shouldFetchRegionProducts,
    hasBootstrappedActiveRegion: cacheState.hasBootstrappedActiveRegion,
    productsPartial: productsQueryState.productsPartial,
    productsFetching: productsQueryState.productsFetching,
    productsRefetching: productsQueryState.productsRefetching,
    productsInitialLoading: productsQueryState.productsInitialLoading,
    productsError: productsQueryState.productsError,
    noMatchedProducts: productsQueryState.noMatchedProducts,
    productsList: productsQueryState.productsList,
    productReference: productsQueryState.productReference,
    queriedHotelIds: productsQueryState.queriedHotelIds,
    requestState: productsQueryState.requestState,
    productsLoading: computed(() => productsQueryState.productsLoading.value)
  };
}
