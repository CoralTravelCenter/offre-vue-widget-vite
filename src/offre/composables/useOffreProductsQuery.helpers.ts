import type { OffreProductsBatchResult } from "@/offre/api";
import type { OffreProductQueryDescriptor } from "@/offre/lib/search-criterias";
import type { OffreHotelRuntimeEntry, OffreRequestState } from "@/offre/types";

export interface OffreProductsQueryMode {
  pageSize: number;
  currentPage: number;
  serverPageMode: boolean;
  totalHotels: number;
  effectiveHotels: OffreHotelRuntimeEntry[];
}

export function getEffectiveHotels(params: {
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

export function resolveProductsQueryMode(params: {
  hotels: OffreHotelRuntimeEntry[];
  pageSize?: number | null;
  currentPage?: number | null;
  serverPageMode?: boolean | null;
}): OffreProductsQueryMode {
  const pageSize = Math.max(1, Number(params.pageSize) || params.hotels.length || 1);
  const currentPage = Math.max(1, Number(params.currentPage) || 1);
  const serverPageMode = Boolean(params.serverPageMode);

  return {
    pageSize,
    currentPage,
    serverPageMode,
    totalHotels: params.hotels.length,
    effectiveHotels: getEffectiveHotels({
      hotels: params.hotels,
      pageSize,
      currentPage,
      serverPageMode
    })
  };
}

export function summarizeDescriptor(descriptor: OffreProductQueryDescriptor) {
  return {
    onlyhotel: descriptor.onlyhotel,
    hotelCount: descriptor.hotels.length,
    hotelIds: descriptor.hotels.map((hotel) => hotel.hotelId),
    arrivalLocationCount: descriptor.searchCriterias.arrivalLocations.length,
    beginDates: descriptor.searchCriterias.beginDates,
    nights: descriptor.searchCriterias.nights.map((night) => night.value)
  };
}

export function buildProductsQueryDescriptorsDebugPayload(
  queryMode: OffreProductsQueryMode,
  productQueryDescriptors: OffreProductQueryDescriptor[]
) {
  return {
    serverPageMode: queryMode.serverPageMode,
    currentPage: queryMode.currentPage,
    pageSize: queryMode.pageSize,
    totalHotels: queryMode.totalHotels,
    effectiveHotelIds: queryMode.effectiveHotels.map((hotel) => String(hotel.id)),
    primaryDescriptors: productQueryDescriptors.map(summarizeDescriptor)
  };
}

export function buildProductsQueryTimingDebugPayload(params: {
  queryMode: OffreProductsQueryMode;
  productQueryDescriptors: OffreProductQueryDescriptor[];
  batchResult: OffreProductsBatchResult;
  totalDurationMs: number;
  primaryDurationMs: number;
}) {
  return {
    totalDurationMs: params.totalDurationMs,
    primaryDurationMs: params.primaryDurationMs,
    fallbackDurationMs: 0,
    serverPageMode: params.queryMode.serverPageMode,
    currentPage: params.queryMode.currentPage,
    pageSize: params.queryMode.pageSize,
    totalHotels: params.queryMode.totalHotels,
    primaryQueryCount: params.productQueryDescriptors.length,
    fallbackQueryCount: 0,
    primaryHotelCount: params.productQueryDescriptors.reduce((sum, descriptor) => sum + descriptor.hotels.length, 0),
    fallbackHotelCount: 0,
    requestState: params.batchResult.meta.requestState,
    resultProducts: params.batchResult.payload.products.length
  };
}

export function resolveProductsRequestState(params: {
  queryEnabled: boolean;
  isPending: boolean;
  isError: boolean;
  productsCount: number;
  batchRequestState?: OffreRequestState;
}): OffreRequestState {
  if (!params.queryEnabled) {
    return "idle";
  }

  if (params.isPending && params.productsCount === 0) {
    return "loading";
  }

  if (params.isError) {
    return "error";
  }

  return params.batchRequestState ?? "success";
}

export function resolveNoMatchedProducts(params: {
  descriptorsCount: number;
  isPending: boolean;
  isError: boolean;
  productsCount: number;
  batchRequestState?: OffreRequestState;
}) {
  return params.descriptorsCount > 0
    && !params.isPending
    && !params.isError
    && params.batchRequestState !== "partial"
    && params.productsCount === 0;
}

export function resolveProductsError(params: {
  isError: boolean;
  batchRequestState?: OffreRequestState;
}) {
  return params.isError || params.batchRequestState === "error";
}
