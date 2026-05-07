import type {
  B2CPriceSearchReference,
  B2CPriceSearchResult,
  B2CProduct,
  OffreProductsBatchResult
} from "offre/api/types";
import type { NormalizedOffreWidgetOptions } from "offre/lib/payload";

export function resolveProductsRequestState(failedQueries: number, queryCount: number) {
  if (queryCount === 0) {
    return "idle" as const;
  }

  if (failedQueries >= queryCount) {
    return "error" as const;
  }

  if (failedQueries > 0) {
    return "partial" as const;
  }

  return "success" as const;
}

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

function sortProductsByPrice(products: B2CProduct[]) {
  return [...products].sort((left, right) => {
    const leftPrice = Number(left?.offers?.[0]?.price?.amount) || Number.MAX_SAFE_INTEGER;
    const rightPrice = Number(right?.offers?.[0]?.price?.amount) || Number.MAX_SAFE_INTEGER;

    return leftPrice - rightPrice;
  });
}

function sortProductsBySourceOrder(
  products: B2CProduct[],
  hotelOrderById: Map<string, number>
) {
  return [...products].sort((left, right) => {
    const leftIndex = hotelOrderById.get(String(left?.hotel?.id ?? "")) ?? Number.MAX_SAFE_INTEGER;
    const rightIndex = hotelOrderById.get(String(right?.hotel?.id ?? "")) ?? Number.MAX_SAFE_INTEGER;

    return leftIndex - rightIndex;
  });
}

export function aggregateProductsBatch(params: {
  responses: Array<PromiseSettledResult<{ result: B2CPriceSearchResult }>>;
  options: NormalizedOffreWidgetOptions;
  hotelOrderById: Map<string, number>;
}) {
  const products: B2CProduct[] = [];
  const reference: B2CPriceSearchReference = {};
  let failedQueries = 0;

  for (const response of params.responses) {
    if (response.status === "rejected") {
      failedQueries += 1;
      continue;
    }

    const result = response.value.result;
    mergeReference(reference, stripReferenceFields(result));

    if (Array.isArray(result.products) && result.products.length > 0) {
      products.push(...result.products);
    }
  }

  const sortedProducts = params.options.sortBy === "source"
    ? sortProductsBySourceOrder(products, params.hotelOrderById)
    : sortProductsByPrice(products);

  const batchResult: OffreProductsBatchResult = {
    payload: {
      products: sortedProducts,
      reference
    },
    meta: {
      requestState: resolveProductsRequestState(failedQueries, params.responses.length),
      failedQueries,
      queryCount: params.responses.length
    }
  };

  return batchResult;
}
