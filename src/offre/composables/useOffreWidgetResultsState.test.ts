import { computed, ref } from "vue";
import { describe, expect, it } from "vitest";
import { useOffreWidgetResultsState } from "@/offre/composables/useOffreWidgetResultsState";
import type { OffreRequestState } from "@/offre/types";

describe("useOffreWidgetResultsState", () => {
  it("shows list skeleton when a fetch is pending and there are no region products", () => {
    const state = useOffreWidgetResultsState({
      effectiveRequestStateSource: ref<OffreRequestState>("loading"),
      effectiveProductsErrorSource: ref(false),
      effectiveNoMatchedProductsSource: ref(false),
      productsPartialSource: ref(false),
      regionProductsCountSource: ref(0),
      mapProductsCountSource: ref(0),
      shouldFetchRegionProductsSource: ref(true),
      productsInitialLoadingSource: ref(true),
      productsRefetchingSource: ref(false),
      productsFetchingSource: ref(false),
      isListPageModeSource: ref(true)
    });

    expect(state.showRegionSkeleton.value).toBe(true);
    expect(state.showMapSkeleton.value).toBe(false);
    expect(state.productsListState.value.modifierClass).toBe("offre-widget__state--loading");
  });

  it("resolves warning and error states separately for list and map views", () => {
    const effectiveRequestState = ref<OffreRequestState>("partial");
    const effectiveProductsError = ref(false);
    const effectiveNoMatchedProducts = ref(false);
    const productsPartial = ref(true);
    const regionProductsCount = ref(2);
    const mapProductsCount = ref(0);

    const state = useOffreWidgetResultsState({
      effectiveRequestStateSource: effectiveRequestState,
      effectiveProductsErrorSource: effectiveProductsError,
      effectiveNoMatchedProductsSource: effectiveNoMatchedProducts,
      productsPartialSource: productsPartial,
      regionProductsCountSource: regionProductsCount,
      mapProductsCountSource: mapProductsCount,
      shouldFetchRegionProductsSource: ref(false),
      productsInitialLoadingSource: ref(false),
      productsRefetchingSource: ref(false),
      productsFetchingSource: ref(false),
      isListPageModeSource: computed(() => false)
    });

    expect(state.productsListState.value.partialMessage).toContain("Часть туров не загрузилась");
    expect(state.mapProductsState.value.partialMessage).toBe("");

    effectiveRequestState.value = "error";
    effectiveProductsError.value = true;

    expect(state.mapProductsState.value.modifierClass).toBe("offre-widget__state--error");
  });
});
