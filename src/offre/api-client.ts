import type {
  B2CApiFailure,
  B2CApiRequestOptions,
  B2CApiResponse,
  B2CHotelsInfoResult,
  B2CListDepartureLocationsResult,
  B2CPriceSearchCriterias,
  B2CPriceSearchResult
} from "@/offre/api-types";

type HttpMethod = "GET" | "POST";

interface B2CApiEndpoint {
  method: HttpMethod;
  path: string;
}

const B2C_ENDPOINT_PREFIX = "/endpoints";
export const PRICE_SEARCH_TIMEOUT_MS = 15_000;
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

function createAbortReason(name: "AbortError" | "TimeoutError", message: string) {
  if (typeof DOMException === "function") {
    return new DOMException(message, name);
  }

  const error = new Error(message);
  error.name = name;
  return error;
}

function createRequestSignal(sourceSignal: AbortSignal | undefined, timeoutMs: number | undefined) {
  if (!timeoutMs || timeoutMs <= 0) {
    return {
      signal: sourceSignal,
      didTimeout: () => false,
      dispose: () => undefined
    };
  }

  const controller = new AbortController();
  let timedOut = false;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const abortFromSource = () => {
    controller.abort(createAbortReason("AbortError", "B2C API request was aborted"));
  };

  if (sourceSignal?.aborted) {
    abortFromSource();
  } else {
    sourceSignal?.addEventListener("abort", abortFromSource, { once: true });
    timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort(createAbortReason("TimeoutError", `B2C API request exceeded ${timeoutMs} ms`));
    }, timeoutMs);
  }

  return {
    signal: controller.signal,
    didTimeout: () => timedOut,
    dispose() {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
      sourceSignal?.removeEventListener("abort", abortFromSource);
    }
  };
}

export function classifyB2CApiFailure(error: unknown): B2CApiFailure {
  if (error && typeof error === "object") {
    const candidate = error as { kind?: unknown; name?: unknown; status?: unknown };

    if (candidate.name === "AbortError") {
      return { kind: "abort" };
    }

    if (candidate.name === "TimeoutError") {
      return { kind: "timeout" };
    }

    if (candidate.kind === "http") {
      return {
        kind: "http",
        status: typeof candidate.status === "number" ? candidate.status : undefined
      };
    }

    if (candidate.kind === "parse") {
      return { kind: "parse" };
    }
  }

  if (error instanceof TypeError) {
    return { kind: "transport" };
  }

  return { kind: "unknown" };
}

async function fetchJson<TResponse>(url: string, init?: RequestInit) {
  const response = await fetch(url, init);

  if (!response.ok) {
    const error = new Error(`B2C API request failed: ${response.status} ${response.statusText}`);
    throw Object.assign(error, {
      kind: "http" as const,
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
      kind: "parse" as const,
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
  const requestSignal = createRequestSignal(options.signal, options.timeoutMs);

  try {
    const response = endpoint.method === "GET"
      ? await fetchJson<B2CApiResponse<TResult>>(
        `${url}${params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : ""}`,
        { signal: requestSignal.signal }
      )
      : await fetchJson<B2CApiResponse<TResult>>(url, {
        method: endpoint.method,
        signal: requestSignal.signal,
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
  } catch (error) {
    const normalizedError = requestSignal.didTimeout()
      ? createAbortReason("TimeoutError", `B2C API request exceeded ${options.timeoutMs} ms`)
      : options.signal?.aborted
        ? createAbortReason("AbortError", "B2C API request was aborted")
        : error;
    const failure = classifyB2CApiFailure(normalizedError);

    logOffreApiDebug("B2C API failure", {
      endpoint: endpoint.path,
      method: endpoint.method,
      durationMs: Math.round(getNow() - startedAt),
      failureKind: failure.kind,
      status: failure.status
    });

    throw normalizedError;
  } finally {
    requestSignal.dispose();
  }
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
    { ...options, timeoutMs: options.timeoutMs ?? PRICE_SEARCH_TIMEOUT_MS }
  );
}

export async function hotelPriceSearchList(
  searchCriterias: B2CPriceSearchCriterias,
  options: B2CApiRequestOptions = {}
) {
  return consultB2CApi<B2CPriceSearchResult>(
    B2C_ENDPOINTS.hotelPriceSearchList,
    { searchCriterias },
    { ...options, timeoutMs: options.timeoutMs ?? PRICE_SEARCH_TIMEOUT_MS }
  );
}
