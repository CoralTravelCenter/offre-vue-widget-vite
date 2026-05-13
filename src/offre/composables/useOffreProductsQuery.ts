import { useQuery } from "@tanstack/vue-query";
import { computed, toValue, type MaybeRefOrGetter } from "vue";
import { hotelPriceSearchList, packagePriceSearchList } from "@/offre/api";
import type {
  B2CHotelInfo,
  B2CLocation,
  B2CPriceSearchResult,
  OffreProductsBatchResult
} from "@/offre/api";
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

function getReturnedHotelIds(result: B2CPriceSearchResult) {
  return new Set(
    (Array.isArray(result.products) ? result.products : [])
      .map((product) => String(product.hotel?.id ?? ""))
      .filter(Boolean)
  );
}

export function buildFallbackQueryDescriptors(params: {
  descriptors: OffreProductQueryDescriptor[];
  responses: Array<PromiseSettledResult<{ result: B2CPriceSearchResult }>>;
}) {
  const fallbackDescriptors: OffreProductQueryDescriptor[] = [];

  for (const [index, descriptor] of params.descriptors.entries()) {
    const response = params.responses[index];

    if (response?.status !== "fulfilled" || descriptor.hotels.length <= 1) {
      continue;
    }

    const returnedHotelIds = getReturnedHotelIds(response.value.result);
    const missingHotels = descriptor.hotels.filter((hotel) => {
      return !returnedHotelIds.has(hotel.hotelId);
    });

    for (const hotel of missingHotels) {
      fallbackDescriptors.push({
        hotels: [hotel],
        onlyhotel: descriptor.onlyhotel,
        searchCriterias: {
          ...descriptor.searchCriterias,
          arrivalLocations: [hotel.arrivalLocation],
          paging: {
            ...descriptor.searchCriterias.paging,
            pageSize: 1
          }
        }
      });
    }
  }

  return fallbackDescriptors;
}

export function useOffreProductsQuery(params: {
  optionsSource: MaybeRefOrGetter<NormalizedOffreWidgetOptions>;
  hotelsSource: MaybeRefOrGetter<OffreHotelRuntimeEntry[]>;
  hotelInfoByIdSource: MaybeRefOrGetter<Map<string, B2CHotelInfo>>;
  selectedTimeframeSource: MaybeRefOrGetter<string>;
  selectedDepartureSource: MaybeRefOrGetter<B2CLocation | null>;
  hotelOrderByIdSource: MaybeRefOrGetter<Map<string, number>>;
}) {
  const productQueryDescriptors = computed(() => {
    return buildOffreProductQueries({
      hotels: toValue(params.hotelsSource),
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
    queryFn: async ({ signal }) => {
      const primaryTasks = productQueryDescriptors.value.map((descriptor) => {
        return () => descriptor.onlyhotel
          ? hotelPriceSearchList(descriptor.searchCriterias, { signal })
          : packagePriceSearchList(descriptor.searchCriterias, { signal });
      });
      const primaryResponses = await runConcurrentSettledTasks(primaryTasks, PRODUCTS_QUERY_CONCURRENCY);

      for (const response of primaryResponses) {
        if (response.status === "rejected") {
          if (isAbortError(response.reason)) {
            throw response.reason;
          }
        }
      }

      const fallbackQueryDescriptors = buildFallbackQueryDescriptors({
        descriptors: productQueryDescriptors.value,
        responses: primaryResponses
      });
      const fallbackTasks = fallbackQueryDescriptors.map((descriptor) => {
        return () => descriptor.onlyhotel
          ? hotelPriceSearchList(descriptor.searchCriterias, { signal })
          : packagePriceSearchList(descriptor.searchCriterias, { signal });
      });
      const fallbackResponses = fallbackTasks.length > 0
        ? await runConcurrentSettledTasks(fallbackTasks, PRODUCTS_QUERY_CONCURRENCY)
        : [];

      for (const response of fallbackResponses) {
        if (response.status === "rejected") {
          if (isAbortError(response.reason)) {
            throw response.reason;
          }
        }
      }

      return aggregateProductsBatch({
        responses: [...primaryResponses, ...fallbackResponses],
        options: toValue(params.optionsSource),
        hotelOrderById: toValue(params.hotelOrderByIdSource)
      });
    }
  });

  return {
    productsQuery,
    refetchProducts: () => productsQuery.refetch(),
    productsList: computed(() => productsQuery.data.value?.payload.products ?? []),
    productReference: computed(() => productsQuery.data.value?.payload.reference ?? {}),
    requestState: computed(() => {
      if (!productQueryDescriptors.value.length) {
        return "idle";
      }

      if (productsQuery.isPending.value) {
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
