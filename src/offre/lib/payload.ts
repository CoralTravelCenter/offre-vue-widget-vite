import type {
  WidgetGroupBy,
  WidgetPayload,
  WidgetHotelDescriptor,
  WidgetHotelEntry,
  WidgetOptions,
  WidgetRoomCriteria,
  WidgetPricingMode,
  WidgetSortBy,
  WidgetTheme,
  WidgetTimeframeConfig
} from "@/widget/types";
import type {BrandKey} from "@/brands/types";

const DEFAULT_GROUP_BY: WidgetGroupBy = "countries";
const DEFAULT_PRICING: WidgetPricingMode = "default";
const DEFAULT_SORT_BY: WidgetSortBy = "price";
const DEFAULT_THEME: WidgetTheme = "default";
const DEFAULT_NIGHTS = [7];
const DEFAULT_TIMEFRAME: WidgetTimeframeConfig = {
  fluid: ["P14D", "P115D"],
  monthly: true
};

export interface NormalizedOffreWidgetOptions extends Omit<WidgetOptions, "groupBy" | "pricing" | "sortBy" | "timeframe" | "nights" | "chartersOnly" | "regionsOrder"> {
  groupBy: WidgetGroupBy;
  chartersOnly: boolean;
  pricing: WidgetPricingMode;
  theme: WidgetTheme;
  timeframe: WidgetTimeframeConfig;
  nights: number[];
  regionsOrder: string[];
  sortBy: WidgetSortBy;
  roomCriterias?: WidgetRoomCriteria[];
  wildcardOption?: string;
  preferRegion?: string;
  departureCity?: string;
  maxPrice?: number | string;
}

export interface NormalizedWidgetHotelDescriptor extends Omit<WidgetHotelDescriptor, "onlyhotel" | "timeframe" | "nights" | "usps"> {
  id: number | string;
  onlyhotel: boolean;
  timeframe?: WidgetTimeframeConfig;
  nights?: number[];
  usps: string[];
}

export interface NormalizedWidgetPayload {
  brand?: BrandKey | string;
  options: NormalizedOffreWidgetOptions;
  hotels: NormalizedWidgetHotelDescriptor[];
}

function isPassenger(value: unknown): value is { passengerType: number; age: number } {
  return isPlainObject(value)
    && typeof value.passengerType === "number"
    && Number.isFinite(value.passengerType)
    && typeof value.age === "number"
    && Number.isFinite(value.age);
}

function normalizeRoomCriterias(value: unknown) {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const normalized = value
    .filter((entry): entry is { passengers: unknown[] } => {
      return isPlainObject(entry) && Array.isArray(entry.passengers);
    })
    .map((entry) => ({
      passengers: entry.passengers.filter(isPassenger).map((passenger) => ({
        passengerType: passenger.passengerType,
        age: passenger.age
      }))
    }))
    .filter((entry) => entry.passengers.length > 0);

  return normalized.length ? normalized : undefined;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function sanitizeWidgetPayload(rawPayload: unknown): WidgetPayload | null {
  if (!isPlainObject(rawPayload)) {
    return null;
  }

  const payload: WidgetPayload = {};

  if (typeof rawPayload.brand === "string" && rawPayload.brand.trim()) {
    payload.brand = rawPayload.brand.trim();
  }

  payload.options = isPlainObject(rawPayload.options)
    ? (rawPayload.options as WidgetOptions)
    : {};
  payload.hotels = Array.isArray(rawPayload.hotels)
    ? rawPayload.hotels
    : [];

  return payload;
}

function normalizeGroupBy(value: WidgetOptions["groupBy"]): WidgetGroupBy {
  if (value === "countries" || value === "regions" || value === "areas" || value === "places") {
    return value;
  }

  return DEFAULT_GROUP_BY;
}

function normalizePricing(value: WidgetOptions["pricing"]): WidgetPricingMode {
  if (value === "per-person" || value === "per-night" || value === "default") {
    return value;
  }

  return DEFAULT_PRICING;
}

function normalizeTheme(value: WidgetOptions["theme"]): WidgetTheme {
  if (value === "elite" || value === "dark" || value === "default") {
    return value;
  }

  return DEFAULT_THEME;
}

function normalizeSortBy(value: WidgetOptions["sortBy"]): WidgetSortBy {
  if (value === "source" || value === "price") {
    return value;
  }

  return DEFAULT_SORT_BY;
}

function normalizeTimeframe(value: unknown): WidgetTimeframeConfig {
  if (!isPlainObject(value)) {
    return { ...DEFAULT_TIMEFRAME };
  }

  const fixed = value.fixed;
  const fluid = value.fluid;
  const monthly = value.monthly === true;

  if (Array.isArray(fixed) && fixed.length) {
    if (
      fixed.length === 2
      && fixed.every((entry) => typeof entry === "string")
    ) {
      return {
        fixed: [fixed[0], fixed[1]],
        monthly
      };
    }

    const fixedFrames = fixed
      .filter((entry): entry is { key: string; frame: [string, string] } => {
        return isPlainObject(entry)
          && typeof entry.key === "string"
          && Array.isArray(entry.frame)
          && entry.frame.length === 2
          && entry.frame.every((frameEntry) => typeof frameEntry === "string");
      })
      .map((entry) => ({
        key: entry.key,
        frame: [entry.frame[0], entry.frame[1]] as [string, string]
      }));

    if (fixedFrames.length) {
      return { fixed: fixedFrames, monthly };
    }
  }

  if (Array.isArray(fluid) && fluid.length === 2 && fluid.every((entry) => typeof entry === "string")) {
    return {
      fluid: [fluid[0], fluid[1]],
      monthly
    };
  }

  return { ...DEFAULT_TIMEFRAME };
}

function normalizeNights(value: unknown, fallback: number[] = DEFAULT_NIGHTS) {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return [Math.trunc(value)];
  }

  if (!Array.isArray(value)) {
    return [...fallback];
  }

  const normalized = value
    .map((entry) => Number(entry))
    .filter((entry) => Number.isFinite(entry) && entry > 0)
    .map((entry) => Math.trunc(entry))
    .sort((left, right) => left - right);

  return normalized.length ? normalized : [...fallback];
}

export function getWidgetHotelId(hotelEntry: WidgetHotelEntry) {
  if (typeof hotelEntry === "number" || typeof hotelEntry === "string") {
    return hotelEntry;
  }

  return hotelEntry?.id;
}

export function normalizeWidgetOptions(options: WidgetOptions | undefined): NormalizedOffreWidgetOptions {
  const source: Partial<WidgetOptions> = isPlainObject(options) ? options : {};

  return {
    ...source,
    groupBy: normalizeGroupBy(source.groupBy),
    chartersOnly: Boolean(source.chartersOnly),
    pricing: normalizePricing(source.pricing),
    theme: normalizeTheme(source.theme),
    timeframe: normalizeTimeframe(source.timeframe),
    nights: normalizeNights(source.nights),
    roomCriterias: normalizeRoomCriterias(source.roomCriterias),
    regionsOrder: Array.isArray(source.regionsOrder)
      ? source.regionsOrder.filter((entry): entry is string => typeof entry === "string")
      : [],
    sortBy: normalizeSortBy(source.sortBy)
  };
}

export function normalizeWidgetHotelDescriptor(
  hotelEntry: WidgetHotelEntry,
  options: NormalizedOffreWidgetOptions
): NormalizedWidgetHotelDescriptor | null {
  const hotelId = getWidgetHotelId(hotelEntry);

  if (hotelId === null || hotelId === undefined || hotelId === "") {
    return null;
  }

  if (typeof hotelEntry === "number" || typeof hotelEntry === "string") {
    return {
      id: hotelId,
      onlyhotel: false,
      usps: []
    };
  }

  const {
    roomCriterias: _ignoredRoomCriterias,
    ...hotelEntryRest
  } = hotelEntry;

  return {
    ...hotelEntryRest,
    id: hotelId,
    onlyhotel: Boolean(hotelEntry.onlyhotel),
    timeframe: hotelEntry.timeframe ? normalizeTimeframe(hotelEntry.timeframe) : undefined,
    nights: hotelEntry.nights ? normalizeNights(hotelEntry.nights, options.nights) : undefined,
    usps: Array.isArray(hotelEntry.usps)
      ? hotelEntry.usps.filter((entry): entry is string => typeof entry === "string")
      : []
  };
}

export function normalizeWidgetHotels(
  hotelsList: WidgetHotelEntry[] | undefined,
  options: NormalizedOffreWidgetOptions
) {
  return (Array.isArray(hotelsList) ? hotelsList : [])
    .map((hotelEntry) => normalizeWidgetHotelDescriptor(hotelEntry, options))
    .filter((hotelEntry): hotelEntry is NormalizedWidgetHotelDescriptor => hotelEntry !== null);
}

export function normalizeRuntimeWidgetPayload(payload: WidgetPayload | undefined): NormalizedWidgetPayload {
  const brand = typeof payload?.brand === "string" && payload.brand.trim()
    ? payload.brand.trim()
    : undefined;
  const options = normalizeWidgetOptions(payload?.options);
  const hotels = normalizeWidgetHotels(payload?.hotels, options);

  return {
    brand,
    options,
    hotels
  };
}

export function getWidgetHotelIds(hotelsList: Array<WidgetHotelEntry | NormalizedWidgetHotelDescriptor> | undefined) {
  const uniqueHotelIds = new Set<string>();

  return (Array.isArray(hotelsList) ? hotelsList : [])
    .map((hotelEntry) => getWidgetHotelId(hotelEntry))
    .filter((hotelId): hotelId is number | string => hotelId !== null && hotelId !== undefined && hotelId !== "")
    .filter((hotelId) => {
      const hotelKey = `${typeof hotelId}:${String(hotelId)}`;

      if (uniqueHotelIds.has(hotelKey)) {
        return false;
      }

      uniqueHotelIds.add(hotelKey);
      return true;
    });
}
