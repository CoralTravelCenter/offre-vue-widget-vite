import type { OffreRequestState } from "@/offre/types";

export interface B2CApiMeta {
  responseDateTime?: string;
  elapsedTime?: string;
  statusCode?: number;
  correlation?: string;
}

export interface B2CApiResponse<TResult> {
  result: TResult;
  meta?: B2CApiMeta;
}

export interface B2CLocation {
  id: string;
  type: number;
  name: string;
  friendlyUrl?: string;
  isCurrent?: boolean;
}

export interface B2CLocationName {
  name: string;
}

export type B2CLocationDirectory = Record<string, B2CLocationName>;

export interface B2CHotelLocationParent {
  id: string;
  type: number;
  name: string;
  countryId?: string;
}

export interface B2CHotelLocation extends B2CLocation {
  parent?: B2CHotelLocationParent;
}

export interface B2CHotelInfo {
  id: string | number;
  name?: string;
  countryKey?: string;
  regionKey?: string;
  areaKey?: string;
  placeKey?: string;
  location?: B2CHotelLocation;
  friendlyUrl?: string;
}

export interface B2CHotelsInfoResult {
  hotels: B2CHotelInfo[];
  countries: B2CLocationDirectory;
  regions: B2CLocationDirectory;
  areas: B2CLocationDirectory;
  places: B2CLocationDirectory;
}

export interface B2CListDepartureLocationsResult {
  locations: B2CLocation[];
}

export interface B2CPassenger {
  passengerType: number;
  age: number;
}

export interface B2CRoomCriteria {
  passengers: B2CPassenger[];
}

export interface B2CNightCriteria {
  value: number;
}

export interface B2CArrivalLocationCriteria {
  id: string;
  type: number;
}

export interface B2CAdditionalFilterValue {
  id: string;
  value: string;
}

export interface B2CAdditionalFilter {
  type: number;
  values: B2CAdditionalFilterValue[];
  providers: string[];
}

export interface B2CPagingCriteria {
  pageNumber: number;
  pageSize: number;
  sortType: number;
}

export interface B2CPackageSearchCriterias {
  datePickerMode: number;
  roomCriterias: B2CRoomCriteria[];
  reservationType: 1;
  imageSizes: number[];
  beginDates: [string, string];
  nights: B2CNightCriteria[];
  departureLocations: B2CLocation[];
  arrivalLocations: B2CArrivalLocationCriteria[];
  paging: B2CPagingCriteria;
  flightType: 0 | 2;
  additionalFilters: B2CAdditionalFilter[];
}

export interface B2CHotelSearchCriterias {
  reservationType: 2;
  roomCriterias: B2CRoomCriteria[];
  paging: B2CPagingCriteria;
  beginDates: [string, string];
  nights: B2CNightCriteria[];
  arrivalLocations: B2CArrivalLocationCriteria[];
  additionalFilters: B2CAdditionalFilter[];
}

export type B2CPriceSearchCriterias = B2CPackageSearchCriterias | B2CHotelSearchCriterias;

export interface B2COfferPrice {
  amount?: number | string;
  oldAmount?: number | string;
  currency?: string;
  discountPercent?: number | string;
}

export interface B2COfferLink {
  redirectionUrl?: string;
  queryParam?: string;
}

export interface B2COfferRoomPassenger {
  age?: number;
  passengerType?: number;
}

export interface B2COfferRoom {
  passengers?: B2COfferRoomPassenger[];
  mealKey?: string | number;
  roomKey?: string | number;
  accommodationKey?: string | number;
}

export interface B2COfferFlight {
  flightDate?: string;
}

export interface B2COffer {
  price?: B2COfferPrice;
  link?: B2COfferLink;
  checkInDate?: string;
  stayNights?: number;
  flight?: B2COfferFlight;
  rooms?: B2COfferRoom[];
}

export interface B2CHotelImageSize {
  type?: number;
  url?: string;
}

export interface B2CHotelImage {
  sizes?: B2CHotelImageSize[];
}

export interface B2CHotelCoordinates {
  latitude?: number | string;
  longitude?: number | string;
}

export interface B2CProductHotel {
  id?: number | string;
  name?: string;
  locationSummary?: string;
  categoryKey?: string | number;
  countryKey?: string | number;
  recommended?: boolean;
  exclusive?: boolean;
  eliteHotel?: boolean;
  sunFamilyClub?: boolean;
  coralFamilyClub?: boolean;
  images?: B2CHotelImage[];
  coordinates?: B2CHotelCoordinates | null;
  location?: B2CHotelLocation;
}

export interface B2CProduct {
  hotel?: B2CProductHotel;
  offers?: B2COffer[];
}

export interface B2CReferenceValue {
  name?: string;
}

export interface B2CHotelCategoryReference extends B2CReferenceValue {
  starCount?: number;
}

export interface B2CPriceSearchReference {
  hotelCategories?: Record<string, B2CHotelCategoryReference>;
  meals?: Record<string, B2CReferenceValue>;
  [key: string]: unknown;
}

export interface B2CPriceSearchResult {
  products?: B2CProduct[];
  topProducts?: B2CProduct[];
  filter?: Record<string, unknown>;
  availableSortTypes?: unknown[];
  searchCriterias?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface OffreProductsBatchPayload {
  products: B2CProduct[];
  reference: B2CPriceSearchReference;
}

export interface OffreProductsBatchMeta {
  requestState: OffreRequestState;
  failedQueries: number;
  queryCount: number;
}

export interface OffreProductsBatchResult {
  payload: OffreProductsBatchPayload;
  meta: OffreProductsBatchMeta;
}

type HttpMethod = "GET" | "POST";

interface B2CApiEndpoint {
  method: HttpMethod;
  path: string;
}

interface B2CApiRequestOptions {
  signal?: AbortSignal;
}

const B2C_ENDPOINT_PREFIX = "/endpoints";
const B2C_ENDPOINTS = {
  listDepartureLocations: {
    method: "POST",
    path: "/PackageTourHotelProduct/ListDepartureLocations"
  },
  listHotelsInfo: {
    method: "POST",
    path: "/HotelContent/ListHotelsInfo"
  },
  packagePriceSearchList: {
    method: "POST",
    path: "/PackageTourHotelProduct/PriceSearchList"
  },
  hotelPriceSearchList: {
    method: "POST",
    path: "/OnlyHotelProduct/PriceSearchList"
  }
} satisfies Record<string, B2CApiEndpoint>;

function resolveEndpointUrl(endpoint: B2CApiEndpoint) {
  return `${B2C_ENDPOINT_PREFIX}${endpoint.path}`;
}

export function shouldDebugOffreRequests() {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const params = new URLSearchParams(window.location.search);

    return params.get("offreDebug") === "1"
      || window.sessionStorage.getItem("offreDebug") === "1";
  } catch {
    return false;
  }
}

function getNow() {
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return performance.now();
  }

  return Date.now();
}

function summarizeB2CResponse(response: B2CApiResponse<unknown>) {
  const result = response.result;

  if (!result || typeof result !== "object" || Array.isArray(result)) {
    return {};
  }

  const summary = result as Record<string, unknown>;

  return {
    products: Array.isArray(summary.products) ? summary.products.length : undefined,
    topProducts: Array.isArray(summary.topProducts) ? summary.topProducts.length : undefined,
    hotels: Array.isArray(summary.hotels) ? summary.hotels.length : undefined,
    locations: Array.isArray(summary.locations) ? summary.locations.length : undefined
  };
}

function logOffreApiDebug(message: string, details: Record<string, unknown>) {
  if (!shouldDebugOffreRequests()) {
    return;
  }

  console.info(`OffreWidget: ${message} ${JSON.stringify(details)}`);
}

async function fetchJson<TResponse>(url: string, init?: RequestInit) {
  const response = await fetch(url, init);

  if (!response.ok) {
    const error = new Error(`B2C API request failed: ${response.status} ${response.statusText}`);
    throw Object.assign(error, {
      status: response.status,
      statusText: response.statusText,
      url
    });
  }

  try {
    return await response.json() as TResponse;
  } catch (error) {
    const parseError = new Error(`B2C API response parse failed for ${url}`);
    throw Object.assign(parseError, {
      cause: error,
      url
    });
  }
}

async function consultB2CApi<TResult>(
  endpoint: B2CApiEndpoint,
  params?: Record<string, unknown>,
  options: B2CApiRequestOptions = {}
) {
  const url = resolveEndpointUrl(endpoint);
  const startedAt = getNow();

  if (endpoint.method === "GET") {
    const queryString = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : "";
    const response = await fetchJson<B2CApiResponse<TResult>>(`${url}${queryString}`, {
      signal: options.signal
    });

    logOffreApiDebug("B2C API timing", {
      endpoint: endpoint.path,
      method: endpoint.method,
      durationMs: Math.round(getNow() - startedAt),
      apiElapsedTime: response.meta?.elapsedTime,
      correlation: response.meta?.correlation,
      ...summarizeB2CResponse(response)
    });

    return response;
  }

  const response = await fetchJson<B2CApiResponse<TResult>>(url, {
    method: endpoint.method,
    signal: options.signal,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(params ?? {})
  });

  logOffreApiDebug("B2C API timing", {
    endpoint: endpoint.path,
    method: endpoint.method,
    durationMs: Math.round(getNow() - startedAt),
    apiElapsedTime: response.meta?.elapsedTime,
    correlation: response.meta?.correlation,
    ...summarizeB2CResponse(response)
  });

  return response;
}

export async function listDepartureLocations(options: B2CApiRequestOptions = {}) {
  return consultB2CApi<B2CListDepartureLocationsResult>(
    B2C_ENDPOINTS.listDepartureLocations,
    undefined,
    options
  );
}

export async function listHotelsInfo(
  hotelIds: Array<number | string>,
  imageSizes = [4, 7],
  options: B2CApiRequestOptions = {}
) {
  return consultB2CApi<B2CHotelsInfoResult>(
    B2C_ENDPOINTS.listHotelsInfo,
    { hotelIds, imageSizes },
    options
  );
}

export async function packagePriceSearchList(
  searchCriterias: B2CPriceSearchCriterias,
  options: B2CApiRequestOptions = {}
) {
  return consultB2CApi<B2CPriceSearchResult>(
    B2C_ENDPOINTS.packagePriceSearchList,
    { searchCriterias },
    options
  );
}

export async function hotelPriceSearchList(
  searchCriterias: B2CPriceSearchCriterias,
  options: B2CApiRequestOptions = {}
) {
  return consultB2CApi<B2CPriceSearchResult>(
    B2C_ENDPOINTS.hotelPriceSearchList,
    { searchCriterias },
    options
  );
}
