import type { B2COffer, B2CPriceSearchReference, B2CProduct } from "@/offre/api";
import type { OffreOfferCardTerm } from "@/offre/types";
import {
  formatCurrencySafe,
  resolveHotelImageUrl,
  resolveOfferHref,
  resolveOfferPartySuffix,
  resolveOfferPriceValue,
  stripEnglishBracketFragments
} from "@/offre/lib/product-offer";
import { getReferenceValue } from "@/offre/lib/reference";

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

export interface OffreMapBasePoint {
  key: string;
  hotelId: string;
  hotelName: string;
  locationLabel: string;
  imageUrl: string;
  latitude: number;
  longitude: number;
  categoryKey?: string | number;
  packageOffer: B2COffer | null;
  isFamilyClub: boolean;
  isEliteHotel: boolean;
}

export interface OffreMapDisplayPoint extends OffreMapBasePoint {
  effectiveOffer: B2COffer | null;
  currentPriceValue: number;
  currentPriceLabel: string;
  priceSuffix: string;
  offerHref: string;
}

export type OffreMapSearchPoint = OffreMapDisplayPoint;

export interface OffreMapOverlayModel {
  point: OffreMapDisplayPoint;
  terms: OffreOfferCardTerm[];
  starItems: boolean[];
}

export function buildBaseMapPoints(products: B2CProduct[]) {
  return products
    .map<OffreMapBasePoint | null>((product, index) => {
      const hotel = product.hotel ?? {};
      const coordinates = hotel.coordinates ?? null;
      const latitude = normalizeMapCoordinate(coordinates?.latitude);
      const longitude = normalizeMapCoordinate(coordinates?.longitude);
      const packageOffer = getPrimaryMapOffer(product);
      const hotelId = String(hotel.id ?? hotel.name ?? index);

      if (latitude === null || longitude === null) {
        return null;
      }

      return {
        key: String(hotel.id ?? hotel.name ?? index),
        hotelId,
        hotelName: stripEnglishBracketFragments(hotel.name) || "Без названия",
        locationLabel: stripEnglishBracketFragments(hotel.locationSummary),
        imageUrl: resolveHotelImageUrl(hotel.images),
        latitude,
        longitude,
        categoryKey: hotel.categoryKey,
        packageOffer,
        isFamilyClub: Boolean(hotel.sunFamilyClub || hotel.coralFamilyClub),
        isEliteHotel: Boolean(hotel.eliteHotel)
      };
    })
    .filter((point): point is OffreMapBasePoint => point !== null);
}

export function buildMapSearchPoints(params: {
  points: OffreMapBasePoint[];
  hotelOffersByHotelId: Map<string, B2COffer | null>;
  mapOfferMode: "package" | "hotel";
  pricingMode?: unknown;
  hostname: string;
}) {
  return params.points.map<OffreMapSearchPoint>((point) => {
    const effectiveOffer = params.mapOfferMode === "hotel"
      ? params.hotelOffersByHotelId.get(point.hotelId) ?? point.packageOffer
      : point.packageOffer;
    const passengersCount = getOfferPassengersCount(effectiveOffer);
    const stayNights = Number(effectiveOffer?.stayNights) || 0;
    const currentPriceValue = resolveOfferPriceValue(
      effectiveOffer?.price?.amount,
      params.pricingMode,
      passengersCount,
      stayNights
    );

    return {
      ...point,
      effectiveOffer,
      currentPriceValue,
      currentPriceLabel: formatCurrencySafe(currentPriceValue),
      priceSuffix: resolveOfferPartySuffix(params.pricingMode, effectiveOffer?.rooms?.[0]?.passengers),
      offerHref: resolveOfferHref({
        redirectionUrl: effectiveOffer?.link?.redirectionUrl,
        queryParam: effectiveOffer?.link?.queryParam,
        hostname: params.hostname
      })
    };
  });
}

export function buildPointsByHotelId<TPoint extends { hotelId: string }>(points: TPoint[]) {
  return points.reduce<Map<string, TPoint>>((accumulator, point) => {
    accumulator.set(point.hotelId, point);
    return accumulator;
  }, new Map<string, TPoint>());
}

export function buildHotelIdSet(points: Array<{ hotelId: string }>) {
  return new Set(points.map((point) => point.hotelId));
}

export function buildMapPointsLocationKey(
  points: Array<{ hotelId: string; longitude: number; latitude: number }>
) {
  return points
    .map((point) => `${point.hotelId}:${point.longitude.toFixed(4)},${point.latitude.toFixed(4)}`)
    .join("|");
}
