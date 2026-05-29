import { keepPreviousData, useQuery } from "@tanstack/vue-query";
import { computed, toValue, type MaybeRefOrGetter } from "vue";
import { hotelPriceSearchList, packagePriceSearchList } from "@/offre/api";
import type {
  B2CHotelInfo,
  B2CLocation,
  OffreProductsBatchResult
} from "@/offre/api";
import { shouldDebugOffreRequests } from "@/offre/api";
import type { NormalizedOffreWidgetOptions } from "@/offre/lib/payload";
import { aggregateProductsBatch } from "@/offre/lib/products-batch";
import {
  buildOffreProductQueries,
} from "@/offre/lib/search-criterias";
import { offreQueryConfig, offreQueryKeys, offreQueryPersisters } from "@/offre/query";
import type { OffreHotelRuntimeEntry } from "@/offre/types";
import { runConcurrentSettledTasks } from "@/lib/concurrency";
import {
  buildProductsQueryDescriptorsDebugPayload,
  buildProductsQueryTimingDebugPayload,
  resolveNoMatchedProducts,
  resolveProductsError,
  resolveProductsQueryMode,
  resolveProductsRequestState
} from "@/offre/composables/useOffreProductsQuery.helpers";

const PRODUCTS_QUERY_CONCURRENCY = 6;

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

function getNow() {
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return performance.now();
  }

  return Date.now();
}

function logProductsQueryDebug(message: string, details: Record<string, unknown>) {
  if (!shouldDebugOffreRequests()) {
    return;
  }

  console.info(`OffreWidget: ${message} ${JSON.stringify(details)}`);
}

export function useOffreProductsQuery(params: {
  optionsSource: MaybeRefOrGetter<NormalizedOffreWidgetOptions>;
  hotelsSource: MaybeRefOrGetter<OffreHotelRuntimeEntry[]>;
  hotelInfoByIdSource: MaybeRefOrGetter<Map<string, B2CHotelInfo>>;
  selectedTimeframeSource: MaybeRefOrGetter<string>;
  selectedDepartureSource: MaybeRefOrGetter<B2CLocation | null>;
  hotelOrderByIdSource: MaybeRefOrGetter<Map<string, number>>;
  enabledSource?: MaybeRefOrGetter<boolean>;
  currentPageSource?: MaybeRefOrGetter<number>;
  pageSizeSource?: MaybeRefOrGetter<number>;
  serverPageModeSource?: MaybeRefOrGetter<boolean>;
}) {
  const queryMode = computed(() => {
    return resolveProductsQueryMode({
      hotels: toValue(params.hotelsSource),
      pageSize: Number(toValue(params.pageSizeSource)),
      currentPage: Number(toValue(params.currentPageSource)),
      serverPageMode: Boolean(toValue(params.serverPageModeSource))
    });
  });
  const queriedHotelIds = computed(() => {
    return queryMode.value.effectiveHotels.map((hotel) => String(hotel.id));
  });
  const productsList = computed(() => productsQuery.data.value?.payload.products ?? []);
  const productReference = computed(() => productsQuery.data.value?.payload.reference ?? {});
  const productsCount = computed(() => productsList.value.length);
  const batchRequestState = computed(() => productsQuery.data.value?.meta.requestState);
  const productsInitialLoading = computed(() => {
    return productsQuery.isPending.value && productsCount.value === 0;
  });
  const requestState = computed(() => {
    return resolveProductsRequestState({
      queryEnabled: queryEnabled.value,
      isPending: productsQuery.isPending.value,
      isError: productsQuery.isError.value,
      productsCount: productsCount.value,
      batchRequestState: batchRequestState.value
    });
  });
  const noMatchedProducts = computed(() => {
    return resolveNoMatchedProducts({
      descriptorsCount: productQueryDescriptors.value.length,
      isPending: productsQuery.isPending.value,
      isError: productsQuery.isError.value,
      productsCount: productsCount.value
    });
  });
  const productsError = computed(() => {
    return resolveProductsError({
      isError: productsQuery.isError.value,
      batchRequestState: batchRequestState.value
    });
  });
  const productQueryDescriptors = computed(() => {
    return buildOffreProductQueries({
      hotels: queryMode.value.effectiveHotels,
      hotelInfoById: toValue(params.hotelInfoByIdSource),
      selectedTimeframe: toValue(params.selectedTimeframeSource),
      selectedDeparture: toValue(params.selectedDepartureSource),
      options: toValue(params.optionsSource)
    });
  });
  const productQueryKey = computed(() => {
    return offreQueryKeys.productsBatch(
      productQueryDescriptors.value.map((descriptor) => descriptor.searchCriterias)
    );
  });
  const queryEnabled = computed(() => {
    return Boolean(toValue(params.enabledSource) ?? true)
      && productQueryDescriptors.value.length > 0;
  });

  const productsQuery = useQuery<OffreProductsBatchResult>({
    queryKey: productQueryKey,
    enabled: queryEnabled,
    staleTime: offreQueryConfig.productsBatch.staleTime,
    gcTime: offreQueryConfig.productsBatch.gcTime,
    persister: offreQueryPersisters.productsBatch.persisterFn,
    placeholderData: keepPreviousData,
    queryFn: async ({ signal }) => {
      const totalStartedAt = getNow();
      const primaryTasks = productQueryDescriptors.value.map((descriptor) => {
        return () => descriptor.onlyhotel
          ? hotelPriceSearchList(descriptor.searchCriterias, { signal })
          : packagePriceSearchList(descriptor.searchCriterias, { signal });
      });
      const primaryStartedAt = getNow();
      const primaryResponses = await runConcurrentSettledTasks(primaryTasks, PRODUCTS_QUERY_CONCURRENCY);
      const primaryDurationMs = Math.round(getNow() - primaryStartedAt);

      for (const response of primaryResponses) {
        if (response.status === "rejected") {
          if (isAbortError(response.reason)) {
            throw response.reason;
          }
        }
      }

      logProductsQueryDebug("products-query descriptors", {
        ...buildProductsQueryDescriptorsDebugPayload(queryMode.value, productQueryDescriptors.value)
      });

      const batchResult = aggregateProductsBatch({
        responses: primaryResponses,
        options: toValue(params.optionsSource),
        hotelOrderById: toValue(params.hotelOrderByIdSource)
      });

      logProductsQueryDebug("products-query timing", {
        ...buildProductsQueryTimingDebugPayload({
          queryMode: queryMode.value,
          productQueryDescriptors: productQueryDescriptors.value,
          batchResult,
          totalDurationMs: Math.round(getNow() - totalStartedAt),
          primaryDurationMs
        })
      });

      return batchResult;
    }
  });

  return {
    productsQuery,
    refetchProducts: () => productsQuery.refetch(),
    queriedHotelIds,
    productsList,
    productReference,
    productsInitialLoading,
    requestState,
    noMatchedProducts,
    productsPartial: computed(() => batchRequestState.value === "partial"),
    productsError,
    productsFetching: computed(() => productsQuery.isFetching.value),
    productsRefetching: computed(() => productsQuery.isRefetching.value),
    productsLoading: computed(() => (productsQuery.isFetching.value ? 100 : 0))
  };
}
