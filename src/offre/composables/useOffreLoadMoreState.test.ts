import { computed, nextTick, ref } from "vue";
import { describe, expect, it } from "vitest";
import { useOffreLoadMoreState } from "@/offre/composables/useOffreLoadMoreState";

describe("useOffreLoadMoreState", () => {
  it("increments the page and exposes loading helpers for a pending load more", async () => {
    const currentPage = ref(1);
    const canLoadMore = ref(true);
    const totalProducts = ref(12);
    const paginatedProductsLength = ref(5);
    const productsRefetching = ref(false);
    const productsError = ref(false);
    const noMatchedProducts = ref(false);

    const state = useOffreLoadMoreState({
      currentPageRef: currentPage,
      canLoadMoreSource: canLoadMore,
      totalProductsSource: totalProducts,
      paginatedProductsLengthSource: paginatedProductsLength,
      productsRefetchingSource: productsRefetching,
      productsErrorSource: productsError,
      noMatchedProductsSource: noMatchedProducts,
      pageSize: 5
    });

    state.handleLoadMore();
    expect(currentPage.value).toBe(2);

    productsRefetching.value = true;
    await nextTick();

    expect(state.loadMoreButtonLabel.value).toBe("Загрузка...");
    expect(state.loadMoreSkeletonItems.value).toBe(5);
    expect(state.remainingProductsCount.value).toBe(7);
    expect(state.nextLoadCount.value).toBe(5);
  });

  it("rolls back the page and shows a warning when the next batch fails", async () => {
    const currentPage = ref(1);
    const productsRefetching = ref(false);
    const productsError = ref(false);

    const state = useOffreLoadMoreState({
      currentPageRef: currentPage,
      canLoadMoreSource: computed(() => true),
      totalProductsSource: computed(() => 10),
      paginatedProductsLengthSource: computed(() => 5),
      productsRefetchingSource: productsRefetching,
      productsErrorSource: productsError,
      noMatchedProductsSource: computed(() => false),
      pageSize: 5
    });

    productsRefetching.value = true;
    state.handleLoadMore();
    await nextTick();

    productsError.value = true;
    productsRefetching.value = false;
    await nextTick();

    expect(currentPage.value).toBe(1);
    expect(state.loadMoreIssueMessage.value).toContain("Не удалось загрузить");
  });
});
