import { computed, ref, toValue, watch, type MaybeRefOrGetter, type Ref } from "vue";
import type { B2CProduct } from "@/offre/api";
import type { OffreTourType, OffreViewMode } from "@/offre/types";
import {
  paginateProducts,
  pruneTourTypeByHotelId,
  readPersistedViewMode,
  resolveTotalItems,
  resolveViewModeStorageKey,
  setNextHotelTourType,
  writePersistedViewMode
} from "@/offre/composables/useOffreWidgetListState.helpers";

export function useOffreWidgetListState(params: {
  productsSource: MaybeRefOrGetter<B2CProduct[]>;
  activeRegionIdSource: MaybeRefOrGetter<string>;
  resetOnActiveRegionChange?: MaybeRefOrGetter<boolean>;
  selectedDepartureIdSource: MaybeRefOrGetter<string>;
  selectedTimeframeSource: MaybeRefOrGetter<string>;
  guestsFilterKeySource?: MaybeRefOrGetter<string>;
  storageKeySource?: MaybeRefOrGetter<string | null | undefined>;
  totalItemsSource?: MaybeRefOrGetter<number>;
  prePaginatedSource?: MaybeRefOrGetter<boolean>;
  viewModeRef?: Ref<OffreViewMode>;
  currentPageRef?: Ref<number>;
  pageSize?: number;
}) {
  const pageSize = params.pageSize ?? 5;
  const viewMode = params.viewModeRef ?? ref<OffreViewMode>("list");
  const tourTypeByHotelId = ref<Record<string, OffreTourType>>({});
  const currentPage = params.currentPageRef ?? ref(1);

  const products = computed(() => toValue(params.productsSource));
  const totalItems = computed(() => {
    return resolveTotalItems(products.value, toValue(params.totalItemsSource));
  });
  const prePaginated = computed(() => Boolean(toValue(params.prePaginatedSource)));
  const viewModeStorageKey = computed(() => resolveViewModeStorageKey(toValue(params.storageKeySource)));
  const totalProducts = computed(() => totalItems.value);
  const totalPages = computed(() => {
    return Math.max(1, Math.ceil(totalProducts.value / pageSize));
  });
  const hasPagination = computed(() => totalProducts.value > pageSize);
  const canLoadMore = computed(() => currentPage.value < totalPages.value);
  const paginatedProducts = computed(() => {
    return paginateProducts(products.value, currentPage.value, pageSize, prePaginated.value);
  });

  watch(products, (nextProducts) => {
    tourTypeByHotelId.value = pruneTourTypeByHotelId(tourTypeByHotelId.value, nextProducts);
  }, { immediate: true });

  function setHotelTourType(hotelId: string, value: OffreTourType) {
    tourTypeByHotelId.value = setNextHotelTourType(tourTypeByHotelId.value, hotelId, value);
  }

  watch([
    () => toValue(params.selectedDepartureIdSource),
    () => toValue(params.selectedTimeframeSource),
    () => toValue(params.guestsFilterKeySource)
  ], () => {
    currentPage.value = 1;
  });

  watch(() => toValue(params.activeRegionIdSource), () => {
    if (Boolean(toValue(params.resetOnActiveRegionChange) ?? true)) {
      currentPage.value = 1;
    }
  });

  watch(totalPages, (nextTotalPages) => {
    if (currentPage.value > nextTotalPages) {
      currentPage.value = nextTotalPages;
    }
  }, { immediate: true });

  watch(viewModeStorageKey, (nextStorageKey) => {
    const persistedViewMode = readPersistedViewMode(nextStorageKey);

    if (persistedViewMode && persistedViewMode !== viewMode.value) {
      viewMode.value = persistedViewMode;
    }
  }, { immediate: true });

  watch(viewMode, (nextViewMode) => {
    writePersistedViewMode(viewModeStorageKey.value, nextViewMode);
  }, { immediate: true });

  return {
    viewMode,
    currentPage,
    totalProducts,
    totalPages,
    hasPagination,
    canLoadMore,
    paginatedProducts,
    tourTypeByHotelId,
    setHotelTourType
  };
}
