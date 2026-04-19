import { computed, ref, toValue, watch, type MaybeRefOrGetter } from "vue";
import type { B2CProduct } from "offre/api/types";
import type { OffreTourType, OffreViewMode } from "offre/types";

const VIEW_MODE_STORAGE_PREFIX = "offre-widget:view-mode";

function canUseSessionStorage() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

function isOffreViewMode(value: unknown): value is OffreViewMode {
  return value === "list" || value === "map";
}

function resolveViewModeStorageKey(value: string | null | undefined) {
  const normalizedValue = String(value ?? "").trim();
  return normalizedValue ? `${VIEW_MODE_STORAGE_PREFIX}:${normalizedValue}` : null;
}

function readPersistedViewMode(storageKey: string | null) {
  if (!storageKey || !canUseSessionStorage()) {
    return null;
  }

  try {
    const storedValue = window.sessionStorage.getItem(storageKey);
    return isOffreViewMode(storedValue) ? storedValue : null;
  } catch {
    return null;
  }
}

function writePersistedViewMode(storageKey: string | null, value: OffreViewMode) {
  if (!storageKey || !canUseSessionStorage()) {
    return;
  }

  try {
    window.sessionStorage.setItem(storageKey, value);
  } catch {
    // Ignore storage write errors.
  }
}

export function useOffreWidgetListState(params: {
  productsSource: MaybeRefOrGetter<B2CProduct[]>;
  activeRegionIdSource: MaybeRefOrGetter<string>;
  selectedDepartureIdSource: MaybeRefOrGetter<string>;
  selectedTimeframeSource: MaybeRefOrGetter<string>;
  guestsFilterKeySource?: MaybeRefOrGetter<string>;
  storageKeySource?: MaybeRefOrGetter<string | null | undefined>;
  pageSize?: number;
}) {
  const pageSize = params.pageSize ?? 5;
  const viewMode = ref<OffreViewMode>("list");
  const tourTypeByHotelId = ref<Record<string, OffreTourType>>({});
  const currentPage = ref(1);

  const products = computed(() => toValue(params.productsSource));
  const viewModeStorageKey = computed(() => resolveViewModeStorageKey(toValue(params.storageKeySource)));
  const totalProducts = computed(() => products.value.length);
  const totalPages = computed(() => {
    return Math.max(1, Math.ceil(totalProducts.value / pageSize));
  });
  const hasPagination = computed(() => totalProducts.value > pageSize);
  const paginatedProducts = computed(() => {
    const startIndex = (currentPage.value - 1) * pageSize;
    return products.value.slice(startIndex, startIndex + pageSize);
  });

  watch(products, (nextProducts) => {
    const knownHotelIds = new Set(nextProducts.map((product) => String(product.hotel?.id ?? "")));

    for (const hotelId of Object.keys(tourTypeByHotelId.value)) {
      if (!knownHotelIds.has(hotelId)) {
        delete tourTypeByHotelId.value[hotelId];
      }
    }
  }, { immediate: true });

  function setHotelTourType(hotelId: string, value: OffreTourType) {
    if (!hotelId) {
      return;
    }

    tourTypeByHotelId.value[hotelId] = value;
  }

  watch([
    () => toValue(params.activeRegionIdSource),
    () => toValue(params.selectedDepartureIdSource),
    () => toValue(params.selectedTimeframeSource),
    () => toValue(params.guestsFilterKeySource)
  ], () => {
    currentPage.value = 1;
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
    paginatedProducts,
    tourTypeByHotelId,
    setHotelTourType
  };
}
