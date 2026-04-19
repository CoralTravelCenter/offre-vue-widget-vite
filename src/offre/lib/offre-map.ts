import type { B2COffer, B2CPriceSearchReference, B2CProduct } from "offre/api/types";
import { formatCurrencySafe } from "offre/lib/product-offer";
import { getReferenceValue } from "offre/lib/reference";

export function normalizeMapCoordinate(value: number | string | undefined) {
  const normalizedValue = Number(value);
  return Number.isFinite(normalizedValue) ? normalizedValue : null;
}

export function getPrimaryMapOffer(product: B2CProduct) {
  return Array.isArray(product.offers) && product.offers.length > 0 ? product.offers[0] : null;
}

export function getOfferPassengersCount(offer: B2COffer | null) {
  return offer?.rooms?.reduce((count, room) => {
    return count + (Array.isArray(room?.passengers) ? room.passengers.length : 0);
  }, 0) ?? 0;
}

export function getMapClusterPriceRange(features: Array<{ properties?: { currentPriceValue?: number } }>) {
  const values = features
    .map((feature) => Number(feature?.properties?.currentPriceValue))
    .filter((value) => Number.isFinite(value) && value > 0);

  if (!values.length) {
    return { min: "", max: "" };
  }

  return {
    min: formatCurrencySafe(Math.min(...values)),
    max: formatCurrencySafe(Math.max(...values))
  };
}

export function normalizeMapSearchValue(value: string | null | undefined) {
  const source = String(value ?? "");

  if (!source) {
    return "";
  }

  const normalizedSource = (() => {
    try {
      return source.normalize("NFKC");
    } catch {
      return source;
    }
  })();

  return normalizedSource
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getMapReferenceValue<TValue extends object>(
  reference: B2CPriceSearchReference,
  field: string,
  key: string | number | undefined
) {
  return getReferenceValue<TValue>(reference, field, key);
}

export function buildMapPointsLocationKey(
  points: Array<{ hotelId: string; longitude: number; latitude: number }>
) {
  return points
    .map((point) => `${point.hotelId}:${point.longitude.toFixed(4)},${point.latitude.toFixed(4)}`)
    .join("|");
}

export async function runConcurrentMapTasks<TValue>(
  tasks: Array<() => Promise<TValue>>,
  concurrency: number
) {
  const results: TValue[] = new Array(tasks.length);
  let cursor = 0;

  async function worker() {
    while (cursor < tasks.length) {
      const taskIndex = cursor;
      cursor += 1;
      results[taskIndex] = await tasks[taskIndex]();
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(Math.max(concurrency, 1), tasks.length || 1) }, () => worker())
  );

  return results;
}
