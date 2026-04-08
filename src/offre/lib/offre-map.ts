import type { B2COffer, B2CPriceSearchReference, B2CProduct } from "offre/api/types";
import { formatCurrencySafe } from "offre/lib/product-offer";

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

export function normalizeMapSearchValue(value: string) {
  return value.trim().toLocaleLowerCase("ru-RU");
}

function getReferenceRecord<TValue extends object>(
  reference: B2CPriceSearchReference,
  field: string
) {
  const value = reference[field];

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, TValue>;
}

export function getMapReferenceValue<TValue extends object>(
  reference: B2CPriceSearchReference,
  field: string,
  key: string | number | undefined
) {
  if (key === null || key === undefined || key === "") {
    return null;
  }

  const record = getReferenceRecord<TValue>(reference, field);

  if (!record) {
    return null;
  }

  return record[String(key)] ?? null;
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
