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
  type OffreProductQueryDescriptor
} from "@/offre/lib/search-criterias";
import { offreQueryConfig, offreQueryKeys, offreQueryPersisters } from "@/offre/query";
import type { OffreHotelRuntimeEntry } from "@/offre/types";
import { runConcurrentSettledTasks } from "@/lib/concurrency";

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

function summarizeDescriptor(descriptor: OffreProductQueryDescriptor) {
  return {
    onlyhotel: descriptor.onlyhotel,
    hotelCount: descriptor.hotels.length,
    hotelIds: descriptor.hotels.map((hotel) => hotel.hotelId),
    arrivalLocationCount: descriptor.searchCriterias.arrivalLocations.length,
    beginDates: descriptor.searchCriterias.beginDates,
    nights: descriptor.searchCriterias.nights.map((night) => night.value)
  };
}

function getEffectiveHotels(params: {
  hotels: OffreHotelRuntimeEntry[];
  pageSize: number;
  currentPage: number;
  serverPageMode: boolean;
}) {
  if (!params.serverPageMode) {
    return params.hotels;
  }

  const visibleHotelsCount = params.currentPage * params.pageSize;
  return params.hotels.slice(0, visibleHotelsCount);
}

export function useOffreProductsQuery(params: {
  optionsSource: MaybeRefOrGetter<NormalizedOffreWidgetOptions>;
  hotelsSource: MaybeRefOrGetter<OffreHotelRuntimeEntry[]>;
  hotelInfoByIdSource: MaybeRefOrGetter<Map<string, B2CHotelInfo>>;
  selectedTimeframeSource: MaybeRefOrGetter<string>;
  selectedDepartureSource: MaybeRefOrGetter<B2CLocation | null>;
  hotelOrderByIdSource: MaybeRefOrGetter<Map<string, number>>;
  currentPageSource?: MaybeRefOrGetter<number>;
  pageSizeSource?: MaybeRefOrGetter<number>;
  serverPageModeSource?: MaybeRefOrGetter<boolean>;
}) {
  const queryMode = computed(() => {
    const hotels = toValue(params.hotelsSource);
    const pageSize = Math.max(1, Number(toValue(params.pageSizeSource)) || hotels.length || 1);
    const currentPage = Math.max(1, Number(toValue(params.currentPageSource)) || 1);
    const serverPageMode = Boolean(toValue(params.serverPageModeSource));
    const effectiveHotels = getEffectiveHotels({
      hotels,
      pageSize,
      currentPage,
      serverPageMode
    });

    return {
      pageSize,
      currentPage,
      serverPageMode,
      totalHotels: hotels.length,
      effectiveHotels
    };
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

  const productsQuery = useQuery<OffreProductsBatchResult>({
    queryKey: productQueryKey,
    enabled: computed(() => productQueryDescriptors.value.length > 0),
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
        serverPageMode: queryMode.value.serverPageMode,
        currentPage: queryMode.value.currentPage,
        pageSize: queryMode.value.pageSize,
        totalHotels: queryMode.value.totalHotels,
        effectiveHotelIds: queryMode.value.effectiveHotels.map((hotel) => String(hotel.id)),
        primaryDescriptors: productQueryDescriptors.value.map(summarizeDescriptor)
      });

      const batchResult = aggregateProductsBatch({
        responses: primaryResponses,
        options: toValue(params.optionsSource),
        hotelOrderById: toValue(params.hotelOrderByIdSource)
      });

      logProductsQueryDebug("products-query timing", {
        totalDurationMs: Math.round(getNow() - totalStartedAt),
        primaryDurationMs,
        fallbackDurationMs: 0,
        serverPageMode: queryMode.value.serverPageMode,
        currentPage: queryMode.value.currentPage,
        pageSize: queryMode.value.pageSize,
        totalHotels: queryMode.value.totalHotels,
        primaryQueryCount: productQueryDescriptors.value.length,
        fallbackQueryCount: 0,
        primaryHotelCount: productQueryDescriptors.value.reduce((sum, descriptor) => sum + descriptor.hotels.length, 0),
        fallbackHotelCount: 0,
        requestState: batchResult.meta.requestState,
        resultProducts: batchResult.payload.products.length
      });

      return batchResult;
    }
  });

  return {
    productsQuery,
    refetchProducts: () => productsQuery.refetch(),
    productsList: computed(() => productsQuery.data.value?.payload.products ?? []),
    productReference: computed(() => productsQuery.data.value?.payload.reference ?? {}),
    productsInitialLoading: computed(() => {
      return productsQuery.isPending.value
        && (productsQuery.data.value?.payload.products.length ?? 0) === 0;
    }),
    requestState: computed(() => {
      if (!productQueryDescriptors.value.length) {
        return "idle";
      }

      if (productsQuery.isPending.value && (productsQuery.data.value?.payload.products.length ?? 0) === 0) {
        return "loading";
      }

      if (productsQuery.isError.value) {
        return "error";
      }

      return productsQuery.data.value?.meta.requestState ?? "success";
    }),
    noMatchedProducts: computed(() => {
      return productQueryDescriptors.value.length > 0
        && !productsQuery.isPending.value
        && !productsQuery.isError.value
        && (productsQuery.data.value?.payload.products.length ?? 0) === 0;
    }),
    productsPartial: computed(() => productsQuery.data.value?.meta.requestState === "partial"),
    productsError: computed(() => {
      return productsQuery.isError.value || productsQuery.data.value?.meta.requestState === "error";
    }),
    productsRefetching: computed(() => productsQuery.isRefetching.value),
    productsLoading: computed(() => (productsQuery.isFetching.value ? 100 : 0))
  };
}
