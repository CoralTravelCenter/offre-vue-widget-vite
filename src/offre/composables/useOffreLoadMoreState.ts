import { computed, ref, toValue, watch, type MaybeRefOrGetter, type Ref } from "vue";

export function useOffreLoadMoreState(params: {
  currentPageRef: Ref<number>;
  canLoadMoreSource: MaybeRefOrGetter<boolean>;
  totalProductsSource: MaybeRefOrGetter<number>;
  paginatedProductsLengthSource: MaybeRefOrGetter<number>;
  productsFetchingSource: MaybeRefOrGetter<boolean>;
  productsErrorSource: MaybeRefOrGetter<boolean>;
  productsPartialSource?: MaybeRefOrGetter<boolean>;
  noMatchedProductsSource: MaybeRefOrGetter<boolean>;
  resetSignalSource?: MaybeRefOrGetter<unknown>;
  pageSize?: number;
}) {
  const pageSize = params.pageSize ?? 5;
  const loadMoreIssueMessage = ref("");
  const isRollingBackLoadMore = ref(false);
  const pendingLoadMoreRequest = ref(false);
  const loadMoreStartProductsLength = ref(0);

  watch(() => toValue(params.resetSignalSource), () => {
    loadMoreIssueMessage.value = "";
    isRollingBackLoadMore.value = false;
    pendingLoadMoreRequest.value = false;
    loadMoreStartProductsLength.value = 0;
  }, { immediate: true });

  watch([
    () => toValue(params.productsErrorSource),
    () => toValue(params.productsPartialSource),
    () => toValue(params.noMatchedProductsSource),
    () => toValue(params.productsFetchingSource),
    () => toValue(params.paginatedProductsLengthSource)
  ], ([hasError, hasPartial, hasNoMatched, isFetching, paginatedProductsLength]) => {
    if (isFetching || params.currentPageRef.value <= 1 || isRollingBackLoadMore.value || !pendingLoadMoreRequest.value) {
      return;
    }

    const hasNoNewVisibleProducts = paginatedProductsLength <= loadMoreStartProductsLength.value;

    if (!hasError && !hasPartial && !hasNoMatched && !hasNoNewVisibleProducts) {
      loadMoreIssueMessage.value = "";
      pendingLoadMoreRequest.value = false;
      loadMoreStartProductsLength.value = 0;
      return;
    }

    isRollingBackLoadMore.value = true;
    loadMoreIssueMessage.value = hasError || hasPartial
      ? "Не удалось загрузить дополнительные варианты. Уже найденные отели остаются на экране."
      : "Для следующей порции подходящих вариантов не нашлось. Уже найденные отели остаются на экране.";
    params.currentPageRef.value -= 1;
  });

  watch(() => toValue(params.productsFetchingSource), (isFetching) => {
    if (!isFetching) {
      isRollingBackLoadMore.value = false;
    }
  });

  watch([
    () => toValue(params.productsFetchingSource),
    pendingLoadMoreRequest
  ], ([isFetching, hasPendingLoadMoreRequest]) => {
    if (
      !isFetching
      && hasPendingLoadMoreRequest
      && !isRollingBackLoadMore.value
      && !toValue(params.productsErrorSource)
      && !toValue(params.productsPartialSource)
      && !toValue(params.noMatchedProductsSource)
    ) {
      pendingLoadMoreRequest.value = false;
      loadMoreStartProductsLength.value = 0;
    }
  });

  const loadMoreSkeletonItems = computed(() => {
    if (!toValue(params.productsFetchingSource) || !toValue(params.canLoadMoreSource)) {
      return 0;
    }

    const remainingItems = Math.max(0, toValue(params.totalProductsSource) - toValue(params.paginatedProductsLengthSource));
    return Math.min(pageSize, remainingItems);
  });

  const remainingProductsCount = computed(() => {
    return Math.max(0, toValue(params.totalProductsSource) - toValue(params.paginatedProductsLengthSource));
  });

  const nextLoadCount = computed(() => {
    return Math.min(pageSize, remainingProductsCount.value);
  });

  const loadMoreButtonLabel = computed(() => {
    if (toValue(params.productsFetchingSource)) {
      return "Загрузка...";
    }

    return "Показать ещё";
  });

  function handleLoadMore() {
    if (!toValue(params.canLoadMoreSource)) {
      return;
    }

    loadMoreIssueMessage.value = "";
    pendingLoadMoreRequest.value = true;
    loadMoreStartProductsLength.value = toValue(params.paginatedProductsLengthSource);
    params.currentPageRef.value += 1;
  }

  return {
    loadMoreIssueMessage,
    loadMoreSkeletonItems,
    remainingProductsCount,
    nextLoadCount,
    loadMoreButtonLabel,
    handleLoadMore
  };
}
