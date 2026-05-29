import type { B2CPriceSearchReference, B2CProduct } from "@/offre/api";
import { dedupeProductsByHotelId } from "@/offre/lib/products-batch";
import { WILDCARD_REGION_ID } from "@/offre/lib/filter-state";
import type { OffreHotelRuntimeEntry, OffreRequestState } from "@/offre/types";

export interface RegionOutcome {
  requestState: "success" | "partial" | "error";
  noMatched: boolean;
  error: boolean;
}

export function createHotelIdSet(hotels: OffreHotelRuntimeEntry[]) {
  return new Set(hotels.map((hotel) => String(hotel.id)));
}

export function filterProductsByHotelIds(products: B2CProduct[], hotelIds: Set<string>) {
  return products.filter((product) => {
    return hotelIds.has(String(product.hotel?.id ?? ""));
  });
}

export function mergeCachedProducts(
  cachedProducts: B2CProduct[],
  nextProducts: B2CProduct[]
) {
  if (nextProducts.length === 0) {
    return cachedProducts;
  }

  const existingProductByHotelId = new Map(
    cachedProducts.map((product) => [String(product.hotel?.id ?? ""), product] as const)
  );
  const nextProductByHotelId = new Map(
    nextProducts.map((product) => [String(product.hotel?.id ?? ""), product] as const)
  );
  const mergedProducts: B2CProduct[] = [];

  for (const cachedProduct of cachedProducts) {
    const hotelId = String(cachedProduct.hotel?.id ?? "");
    mergedProducts.push(nextProductByHotelId.get(hotelId) ?? cachedProduct);
    nextProductByHotelId.delete(hotelId);
  }

  for (const nextProduct of nextProducts) {
    const hotelId = String(nextProduct.hotel?.id ?? "");

    if (!existingProductByHotelId.has(hotelId)) {
      mergedProducts.push(nextProduct);
    }
  }

  return dedupeProductsByHotelId(mergedProducts);
}

export function shouldPersistProductReference(nextReference: B2CPriceSearchReference, productsList: B2CProduct[]) {
  return productsList.length > 0 ? nextReference : null;
}

export function mergeFetchedHotelIds(
  fetchedHotelIds: string[],
  queriedHotelIds: string[],
  requestState: OffreRequestState,
  hasError: boolean
) {
  if (hasError || requestState === "loading" || requestState === "idle" || queriedHotelIds.length === 0) {
    return fetchedHotelIds;
  }

  return Array.from(new Set([
    ...fetchedHotelIds,
    ...queriedHotelIds
  ]));
}

export function resolveRegionOutcome(
  requestState: OffreRequestState,
  hasError: boolean,
  hasNoMatched: boolean
): RegionOutcome | null {
  if (requestState === "loading" || requestState === "idle") {
    return null;
  }

  return {
    requestState: hasError ? "error" : (requestState === "partial" ? "partial" : "success"),
    noMatched: Boolean(hasNoMatched),
    error: Boolean(hasError)
  };
}

export function resolvePendingRegionBootstrapId(params: {
  activeRegionId: string;
  shouldFetch: boolean;
  isFetching: boolean;
}) {
  const regionId = String(params.activeRegionId ?? "").trim();

  if (!regionId || regionId === WILDCARD_REGION_ID) {
    return "";
  }

  if (params.shouldFetch && params.isFetching) {
    return regionId;
  }

  return null;
}

export function mergeBootstrappedRegionIds(
  bootstrappedRegionIds: string[],
  pendingRegionBootstrapId: string,
  requestState: OffreRequestState,
  hasError: boolean,
  queriedHotelIds: string[],
  isFetching: boolean
) {
  if (
    isFetching
    || hasError
    || requestState === "loading"
    || requestState === "idle"
    || queriedHotelIds.length === 0
    || !pendingRegionBootstrapId
  ) {
    return bootstrappedRegionIds;
  }

  return Array.from(new Set([
    ...bootstrappedRegionIds,
    pendingRegionBootstrapId
  ]));
}

export function resolveHasBootstrappedActiveRegion(
  activeRegionKey: string,
  bootstrappedRegionIds: string[]
) {
  return activeRegionKey === WILDCARD_REGION_ID
    || bootstrappedRegionIds.includes(activeRegionKey);
}

export function resolveShouldFetchRegionProducts(params: {
  matchedHotelsCount: number;
  isRegionFullyCached: boolean;
  hasBootstrappedActiveRegion: boolean;
}) {
  return params.matchedHotelsCount > 0
    && (!params.isRegionFullyCached || !params.hasBootstrappedActiveRegion);
}

export function resolveEffectiveRequestState(
  requestState: OffreRequestState,
  activeRegionOutcome: RegionOutcome | null
): OffreRequestState {
  if (requestState !== "idle") {
    return requestState;
  }

  return activeRegionOutcome?.requestState ?? "idle";
}

export function resolveEffectiveProductsError(
  productsError: boolean,
  activeRegionOutcome: RegionOutcome | null
) {
  if (productsError) {
    return true;
  }

  return Boolean(activeRegionOutcome?.error);
}

export function resolveEffectiveNoMatchedProducts(
  noMatchedProducts: boolean,
  activeRegionOutcome: RegionOutcome | null
) {
  if (noMatchedProducts) {
    return true;
  }

  return Boolean(activeRegionOutcome?.noMatched);
}
