import { computed, ref, toValue, watch, type MaybeRefOrGetter } from "vue";
import type { B2CProduct } from "offre/api/types";
import type { OffreTourType, OffreViewMode } from "offre/types";

export function useOffreWidgetListState(params: {
  productsSource: MaybeRefOrGetter<B2CProduct[]>;
  activeRegionIdSource: MaybeRefOrGetter<string>;
  selectedDepartureIdSource: MaybeRefOrGetter<string>;
  selectedTimeframeSource: MaybeRefOrGetter<string>;
  pageSize?: number;
}) {
  const pageSize = params.pageSize ?? 5;
  const viewMode = ref<OffreViewMode>("list");
  const tourTypeByHotelId = ref<Record<string, OffreTourType>>({});
  const currentPage = ref(1);

  const products = computed(() => toValue(params.productsSource));
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
    () => toValue(params.selectedTimeframeSource)
  ], () => {
    currentPage.value = 1;
  });

  watch(totalPages, (nextTotalPages) => {
    if (currentPage.value > nextTotalPages) {
      currentPage.value = nextTotalPages;
    }
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
