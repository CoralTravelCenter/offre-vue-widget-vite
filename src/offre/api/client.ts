import type {
  B2CApiResponse,
  B2CHotelsInfoResult,
  B2CListDepartureLocationsResult,
  B2CPriceSearchCriterias,
  B2CPriceSearchResult
} from "offre/api/types";

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

  if (endpoint.method === "GET") {
    const queryString = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : "";
    return fetchJson<B2CApiResponse<TResult>>(`${url}${queryString}`, {
      signal: options.signal
    });
  }

  return fetchJson<B2CApiResponse<TResult>>(url, {
    method: endpoint.method,
    signal: options.signal,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(params ?? {})
  });
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
