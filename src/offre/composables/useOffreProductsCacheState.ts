import { computed, toValue, watch, type MaybeRefOrGetter } from "vue";
import type { B2CPriceSearchReference, B2CProduct } from "@/offre/api";
import type { OffreHotelRuntimeEntry, OffreRequestState } from "@/offre/types";
import {
  createOffreProductsCacheRefs,
  createHotelIdSet,
  filterProductsByHotelIds,
  mergeBootstrappedRegionIds,
  mergeCachedProducts,
  mergeFetchedHotelIds,
  resetOffreProductsCacheRefs,
  resolveEffectiveNoMatchedProducts,
  resolveEffectiveProductsError,
  resolveEffectiveRequestState,
  resolveHasBootstrappedActiveRegion,
  resolvePendingRegionBootstrapId,
  resolveRegionOutcome,
  resolveShouldFetchRegionProducts,
  shouldPersistProductReference
} from "@/offre/composables/useOffreProductsCacheState.helpers";

interface ProductsCacheStateParams {
  activeRegionIdSource: MaybeRefOrGetter<string>;
  matchedHotelsSource: MaybeRefOrGetter<OffreHotelRuntimeEntry[]>;
  visibleMatchedHotelsSource: MaybeRefOrGetter<OffreHotelRuntimeEntry[]>;
  productsListSource: MaybeRefOrGetter<B2CProduct[]>;
  productReferenceSource: MaybeRefOrGetter<B2CPriceSearchReference>;
  requestStateSource: MaybeRefOrGetter<OffreRequestState>;
  productsErrorSource: MaybeRefOrGetter<boolean>;
  noMatchedProductsSource: MaybeRefOrGetter<boolean>;
  queriedHotelIdsSource: MaybeRefOrGetter<string[]>;
  productsFetchingSource: MaybeRefOrGetter<boolean>;
  isListPageModeSource: MaybeRefOrGetter<boolean>;
  resetSignalSource?: MaybeRefOrGetter<unknown>;
}

function createOffreProductsCacheDerivedState(
  params: ProductsCacheStateParams,
  cacheRefs: ReturnType<typeof createOffreProductsCacheRefs>
) {
  const {
    bootstrappedRegionIds,
    regionOutcomeById,
    productsCacheSource,
    fetchedHotelIdsSource
  } = cacheRefs;

  const activeRegionKey = computed(() => String(toValue(params.activeRegionIdSource) ?? "").trim());
  const visibleMatchedHotelIds = computed(() => {
    return createHotelIdSet(toValue(params.visibleMatchedHotelsSource));
  });

  const regionProductsSource = computed(() => {
    return filterProductsByHotelIds(productsCacheSource.value, visibleMatchedHotelIds.value);
  });

  const mapProductsSource = computed(() => {
    const matchedHotelIds = createHotelIdSet(toValue(params.matchedHotelsSource));
    return filterProductsByHotelIds(productsCacheSource.value, matchedHotelIds);
  });

  const isRegionFullyCached = computed(() => {
    const targetHotels = toValue(params.isListPageModeSource)
      ? toValue(params.visibleMatchedHotelsSource)
      : toValue(params.matchedHotelsSource);

    return targetHotels.length > 0 && targetHotels.every((hotel) => {
      return fetchedHotelIdsSource.value.includes(String(hotel.id));
    });
  });

  const hasBootstrappedActiveRegion = computed(() => {
    return resolveHasBootstrappedActiveRegion(activeRegionKey.value, bootstrappedRegionIds.value);
  });

  const shouldFetchRegionProducts = computed(() => {
    return resolveShouldFetchRegionProducts({
      matchedHotelsCount: toValue(params.matchedHotelsSource).length,
      isRegionFullyCached: isRegionFullyCached.value,
      hasBootstrappedActiveRegion: hasBootstrappedActiveRegion.value
    });
  });

  const activeRegionOutcome = computed(() => {
    return regionOutcomeById.value[activeRegionKey.value] ?? null;
  });

  const effectiveRequestState = computed<OffreRequestState>(() => {
    return resolveEffectiveRequestState(
      toValue(params.requestStateSource),
      activeRegionOutcome.value
    );
  });

  const effectiveProductsError = computed(() => {
    return resolveEffectiveProductsError(
      toValue(params.productsErrorSource),
      activeRegionOutcome.value
    );
  });

  const effectiveNoMatchedProducts = computed(() => {
    return resolveEffectiveNoMatchedProducts(
      toValue(params.noMatchedProductsSource),
      activeRegionOutcome.value
    );
  });

  return {
    activeRegionKey,
    regionProductsSource,
    mapProductsSource,
    effectiveRequestState,
    effectiveProductsError,
    effectiveNoMatchedProducts,
    shouldFetchRegionProducts,
    hasBootstrappedActiveRegion
  };
}

export function useOffreProductsCacheState(params: ProductsCacheStateParams) {
  const cacheRefs = createOffreProductsCacheRefs();
  const {
    bootstrappedRegionIds,
    pendingRegionBootstrapId,
    regionOutcomeById,
    productsCacheSource,
    cachedProductReference,
    fetchedHotelIdsSource
  } = cacheRefs;

  const {
    activeRegionKey,
    regionProductsSource,
    mapProductsSource,
    effectiveRequestState,
    effectiveProductsError,
    effectiveNoMatchedProducts,
    shouldFetchRegionProducts,
    hasBootstrappedActiveRegion
  } = createOffreProductsCacheDerivedState(params, cacheRefs);

  watch(() => toValue(params.resetSignalSource), () => {
    resetOffreProductsCacheRefs(cacheRefs);
  }, { immediate: true });

  watch(() => toValue(params.productsListSource), (nextProducts) => {
    productsCacheSource.value = mergeCachedProducts(productsCacheSource.value, nextProducts);
  }, { immediate: true });

  watch([
    () => toValue(params.productReferenceSource),
    () => toValue(params.productsListSource)
  ], ([nextReference, productsList]) => {
    const persistedReference = shouldPersistProductReference(nextReference, productsList);

    if (persistedReference) {
      cachedProductReference.value = persistedReference;
    }
  }, { immediate: true });

  watch([
    () => toValue(params.requestStateSource),
    () => toValue(params.productsErrorSource),
    () => toValue(params.queriedHotelIdsSource)
  ], ([nextRequestState, hasError, nextQueriedHotelIds]) => {
    fetchedHotelIdsSource.value = mergeFetchedHotelIds(
      fetchedHotelIdsSource.value,
      nextQueriedHotelIds,
      nextRequestState,
      hasError
    );
  }, { immediate: true });

  watch([
    activeRegionKey,
    () => toValue(params.requestStateSource),
    () => toValue(params.productsErrorSource),
    () => toValue(params.noMatchedProductsSource)
  ], ([regionKey, nextRequestState, hasError, hasNoMatched]) => {
    const nextOutcome = resolveRegionOutcome(nextRequestState, hasError, hasNoMatched);

    if (!regionKey || !nextOutcome) {
      return;
    }

    regionOutcomeById.value = {
      ...regionOutcomeById.value,
      [regionKey]: nextOutcome
    };
  }, { immediate: true });

  watch([
    () => toValue(params.activeRegionIdSource),
    shouldFetchRegionProducts,
    () => toValue(params.productsFetchingSource)
  ], ([nextRegionId, shouldFetch, isFetching]) => {
    const nextPendingRegionBootstrapId = resolvePendingRegionBootstrapId({
      activeRegionId: String(nextRegionId ?? ""),
      shouldFetch,
      isFetching
    });

    if (nextPendingRegionBootstrapId === "") {
      pendingRegionBootstrapId.value = "";
      return;
    }

    if (nextPendingRegionBootstrapId) {
      pendingRegionBootstrapId.value = nextPendingRegionBootstrapId;
    }
  }, { immediate: true });

  watch([
    () => toValue(params.productsFetchingSource),
    () => toValue(params.requestStateSource),
    () => toValue(params.productsErrorSource),
    () => toValue(params.queriedHotelIdsSource)
  ], ([isFetching, nextRequestState, hasError, nextQueriedHotelIds]) => {
    const nextBootstrappedRegionIds = mergeBootstrappedRegionIds(
      bootstrappedRegionIds.value,
      pendingRegionBootstrapId.value,
      nextRequestState,
      hasError,
      nextQueriedHotelIds,
      isFetching
    );

    if (nextBootstrappedRegionIds !== bootstrappedRegionIds.value) {
      bootstrappedRegionIds.value = nextBootstrappedRegionIds;
      pendingRegionBootstrapId.value = "";
    }
  }, { immediate: true });

  return {
    regionProductsSource,
    mapProductsSource,
    productReferenceSource: cachedProductReference,
    effectiveRequestState,
    effectiveProductsError,
    effectiveNoMatchedProducts,
    shouldFetchRegionProducts,
    hasBootstrappedActiveRegion
  };
}
