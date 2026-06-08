import type { B2CProduct } from "@/offre/api";
import type { OffreTourType, OffreViewMode } from "@/offre/types";

const VIEW_MODE_STORAGE_PREFIX = "offre-widget:view-mode";

export function canUseSessionStorage() {
  try {
    return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
  } catch {
    return false;
  }
}

export function isOffreViewMode(value: unknown): value is OffreViewMode {
  return value === "list" || value === "map";
}

export function resolveViewModeStorageKey(value: string | null | undefined) {
  const normalizedValue = String(value ?? "").trim();
  return normalizedValue ? `${VIEW_MODE_STORAGE_PREFIX}:${normalizedValue}` : null;
}

export function readPersistedViewMode(storageKey: string | null) {
  if (!storageKey || !canUseSessionStorage()) {
    return null;
  }

  try {
    const storedValue = window.sessionStorage.getItem(storageKey);
    return isOffreViewMode(storedValue) ? storedValue : null;
  } catch {
    return null;
  }
}

export function writePersistedViewMode(storageKey: string | null, value: OffreViewMode) {
  if (!storageKey || !canUseSessionStorage()) {
    return;
  }

  try {
    window.sessionStorage.setItem(storageKey, value);
  } catch {
    // Ignore storage write errors.
  }
}

export function resolveTotalItems(products: B2CProduct[], explicitTotal: unknown) {
  const normalizedExplicitTotal = Number(explicitTotal);

  if (Number.isFinite(normalizedExplicitTotal) && normalizedExplicitTotal >= 0) {
    return normalizedExplicitTotal;
  }

  return products.length;
}

export function paginateProducts(products: B2CProduct[], currentPage: number, pageSize: number, prePaginated: boolean) {
  if (prePaginated) {
    return products;
  }

  const startIndex = (currentPage - 1) * pageSize;
  return products.slice(startIndex, startIndex + pageSize);
}

export function pruneTourTypeByHotelId(
  tourTypeByHotelId: Record<string, OffreTourType>,
  products: B2CProduct[]
) {
  const knownHotelIds = new Set(products.map((product) => String(product.hotel?.id ?? "")));
  const nextTourTypeByHotelId = { ...tourTypeByHotelId };

  for (const hotelId of Object.keys(nextTourTypeByHotelId)) {
    if (!knownHotelIds.has(hotelId)) {
      delete nextTourTypeByHotelId[hotelId];
    }
  }

  return nextTourTypeByHotelId;
}

export function setNextHotelTourType(
  tourTypeByHotelId: Record<string, OffreTourType>,
  hotelId: string,
  value: OffreTourType
) {
  if (!hotelId) {
    return tourTypeByHotelId;
  }

  return {
    ...tourTypeByHotelId,
    [hotelId]: value
  };
}
