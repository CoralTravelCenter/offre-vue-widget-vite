import type {
  B2CPriceSearchReference,
  B2CPriceSearchResult,
  B2CProduct,
  OffreProductsBatchResult
} from "@/offre/api";
import type { NormalizedOffreWidgetOptions } from "@/offre/lib/payload";

export function getPriceSearchProducts(result: B2CPriceSearchResult) {
  if (Array.isArray(result.products) && result.products.length > 0) {
    return result.products;
  }

  if (Array.isArray(result.topProducts) && result.topProducts.length > 0) {
    return result.topProducts;
  }

  return [];
}

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

function resolveProductPrice(product: B2CProduct) {
  return Number(product?.offers?.[0]?.price?.amount) || Number.MAX_SAFE_INTEGER;
}

export function dedupeProductsByHotelId(products: B2CProduct[]) {
  const productsByHotelId = new Map<string, B2CProduct>();
  const productsWithoutHotelId: B2CProduct[] = [];

  for (const product of products) {
    const hotelId = String(product.hotel?.id ?? "").trim();

    if (!hotelId) {
      productsWithoutHotelId.push(product);
      continue;
    }

    const existingProduct = productsByHotelId.get(hotelId);

    if (!existingProduct || resolveProductPrice(product) < resolveProductPrice(existingProduct)) {
      productsByHotelId.set(hotelId, product);
    }
  }

  return [...productsByHotelId.values(), ...productsWithoutHotelId];
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

    products.push(...getPriceSearchProducts(result));
  }

  const dedupedProducts = dedupeProductsByHotelId(products);
  const sortedProducts = params.options.sortBy === "source"
    ? sortProductsBySourceOrder(dedupedProducts, params.hotelOrderById)
    : dedupedProducts;

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
