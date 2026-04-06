import { useQuery } from "@tanstack/vue-query";
import { computed, toValue, type MaybeRefOrGetter } from "vue";
import { hotelPriceSearchList, packagePriceSearchList } from "offre/api/client";
import type {
  B2CHotelInfo,
  B2CLocation,
  B2CPriceSearchReference,
  B2CPriceSearchResult,
  OffreProductsBatchResult
} from "offre/api/types";
import type { NormalizedOffreWidgetOptions } from "offre/lib/payload";
import { buildOffreProductQueries } from "offre/lib/search-criterias";
import { offreQueryConfig } from "offre/query/config";
import { offreQueryKeys } from "offre/query/keys";
import { offreQueryPersisters } from "offre/query/persister";
import type { OffreHotelRuntimeEntry } from "offre/types";
import { stableStringify } from "shared/lib/stable-stringify";

const PRODUCTS_QUERY_CONCURRENCY = 6;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function mergeReference(target: Record<string, unknown>, source: Record<string, unknown>) {
  for (const [key, value] of Object.entries(source)) {
    const currentValue = target[key];

    if (isPlainObject(currentValue) && isPlainObject(value)) {
      mergeReference(currentValue, value);
      continue;
    }

    target[key] = value;
  }
}

function stripReferenceFields(result: B2CPriceSearchResult) {
  const reference = { ...result };

  delete reference.products;
  delete reference.topProducts;
  delete reference.filter;
  delete reference.availableSortTypes;
  delete reference.searchCriterias;

  return reference as B2CPriceSearchReference;
}

function sortProductsByPrice(products: B2CPriceSearchResult["products"]) {
  return [...(products ?? [])].sort((left, right) => {
    const leftPrice = Number(left?.offers?.[0]?.price?.amount) || Number.MAX_SAFE_INTEGER;
    const rightPrice = Number(right?.offers?.[0]?.price?.amount) || Number.MAX_SAFE_INTEGER;

    return leftPrice - rightPrice;
  });
}

function sortProductsBySourceOrder(
  products: B2CPriceSearchResult["products"],
  hotelOrderById: Map<string, number>
) {
  return [...(products ?? [])].sort((left, right) => {
    const leftIndex = hotelOrderById.get(String(left?.hotel?.id ?? "")) ?? Number.MAX_SAFE_INTEGER;
    const rightIndex = hotelOrderById.get(String(right?.hotel?.id ?? "")) ?? Number.MAX_SAFE_INTEGER;

    return leftIndex - rightIndex;
  });
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

async function runConcurrentSettledTasks<TValue>(
  tasks: Array<() => Promise<TValue>>,
  concurrency: number
) {
  const results: Array<PromiseSettledResult<TValue>> = new Array(tasks.length);
  let cursor = 0;

  async function worker() {
    while (cursor < tasks.length) {
      const taskIndex = cursor;
      cursor += 1;

      try {
        results[taskIndex] = {
          status: "fulfilled",
          value: await tasks[taskIndex]()
        };
      } catch (error) {
        results[taskIndex] = {
          status: "rejected",
          reason: error
        };
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(Math.max(concurrency, 1), tasks.length || 1) }, () => worker())
  );

  return results;
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

  const productsQuery = useQuery({
    queryKey: productQueryKey,
    enabled: computed(() => productQueryDescriptors.value.length > 0),
    staleTime: offreQueryConfig.productsBatch.staleTime,
    gcTime: offreQueryConfig.productsBatch.gcTime,
    persister: offreQueryPersisters.productsBatch.persisterFn,
    queryFn: async ({ signal }) => {
      const products: NonNullable<B2CPriceSearchResult["products"]> = [];
      const reference: B2CPriceSearchReference = {};
      let failedQueries = 0;
      const tasks = productQueryDescriptors.value.map((descriptor) => {
        return () => descriptor.onlyhotel
          ? hotelPriceSearchList(descriptor.searchCriterias, { signal })
          : packagePriceSearchList(descriptor.searchCriterias, { signal });
      });
      const responses = await runConcurrentSettledTasks(tasks, PRODUCTS_QUERY_CONCURRENCY);

      for (const response of responses) {
        if (response.status === "rejected") {
          if (isAbortError(response.reason)) {
            throw response.reason;
          }

          failedQueries += 1;
          continue;
        }

        const result = response.value.result;
        mergeReference(reference, stripReferenceFields(result));

        if (Array.isArray(result.products) && result.products.length > 0) {
          products.push(...result.products);
        }
      }

      const options = toValue(params.optionsSource);
      const hotelOrderById = toValue(params.hotelOrderByIdSource);
      const sortedProducts = options.sortBy === "source"
        ? sortProductsBySourceOrder(products, hotelOrderById)
        : sortProductsByPrice(products);

      const batchResult: OffreProductsBatchResult = {
        payload: {
          products: sortedProducts,
          reference
        },
        meta: {
          requestState: failedQueries === responses.length ? "error" : "success",
          failedQueries,
          queryCount: responses.length
        }
      };

      return batchResult;
    }
  });

  const querySignature = computed(() => stableStringify(productQueryDescriptors.value));

  return {
    productsQuery,
    querySignature,
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
    productsError: computed(() => {
      return productsQuery.isError.value || productsQuery.data.value?.meta.requestState === "error";
    }),
    productsLoading: computed(() => (productsQuery.isFetching.value ? 100 : 0))
  };
}
