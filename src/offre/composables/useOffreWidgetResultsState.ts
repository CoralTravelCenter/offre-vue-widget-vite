import { computed, toValue, type MaybeRefOrGetter } from "vue";
import { resolveProductsListState } from "@/offre/lib/offre-widget-view";
import type { OffreRequestState } from "@/offre/types";

export function useOffreWidgetResultsState(params: {
  effectiveRequestStateSource: MaybeRefOrGetter<OffreRequestState>;
  effectiveProductsErrorSource: MaybeRefOrGetter<boolean>;
  effectiveNoMatchedProductsSource: MaybeRefOrGetter<boolean>;
  productsPartialSource: MaybeRefOrGetter<boolean>;
  regionProductsCountSource: MaybeRefOrGetter<number>;
  mapProductsCountSource: MaybeRefOrGetter<number>;
  shouldFetchRegionProductsSource: MaybeRefOrGetter<boolean>;
  productsInitialLoadingSource: MaybeRefOrGetter<boolean>;
  productsRefetchingSource: MaybeRefOrGetter<boolean>;
  productsFetchingSource: MaybeRefOrGetter<boolean>;
  isListPageModeSource: MaybeRefOrGetter<boolean>;
}) {
  const productsListState = computed(() => {
    return resolveProductsListState({
      requestState: toValue(params.effectiveRequestStateSource),
      productsError: toValue(params.effectiveProductsErrorSource) && toValue(params.regionProductsCountSource) === 0,
      productsPartial: toValue(params.productsPartialSource),
      noMatchedProducts: toValue(params.effectiveNoMatchedProductsSource) && toValue(params.regionProductsCountSource) === 0,
      hasProducts: toValue(params.regionProductsCountSource) > 0
    });
  });

  const mapProductsState = computed(() => {
    return resolveProductsListState({
      requestState: toValue(params.effectiveRequestStateSource),
      productsError: toValue(params.effectiveProductsErrorSource) && toValue(params.mapProductsCountSource) === 0,
      productsPartial: toValue(params.productsPartialSource),
      noMatchedProducts: toValue(params.effectiveNoMatchedProductsSource) && toValue(params.mapProductsCountSource) === 0,
      hasProducts: toValue(params.mapProductsCountSource) > 0
    });
  });

  const showRegionSkeleton = computed(() => {
    return toValue(params.regionProductsCountSource) === 0
      && toValue(params.shouldFetchRegionProductsSource)
      && (
        toValue(params.productsInitialLoadingSource)
        || toValue(params.productsRefetchingSource)
        || toValue(params.productsFetchingSource)
        || toValue(params.effectiveRequestStateSource) === "loading"
      );
  });

  const showMapSkeleton = computed(() => {
    return !toValue(params.isListPageModeSource)
      && toValue(params.shouldFetchRegionProductsSource)
      && (
        toValue(params.productsInitialLoadingSource)
        || toValue(params.productsRefetchingSource)
        || toValue(params.productsFetchingSource)
        || toValue(params.effectiveRequestStateSource) === "loading"
      );
  });

  return {
    productsListState,
    mapProductsState,
    showRegionSkeleton,
    showMapSkeleton
  };
}
