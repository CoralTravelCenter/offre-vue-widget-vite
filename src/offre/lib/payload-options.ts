import type {
  WidgetGroupBy,
  WidgetOptions,
  WidgetPricingMode,
  WidgetSortBy,
  WidgetTheme,
  WidgetTimeframeConfig
} from "@/widget/types";
import type { NormalizedOffreWidgetOptions } from "@/offre/lib/payload-types";
import { isPlainObject, normalizeRoomCriterias } from "@/offre/lib/payload-utils";

const DEFAULT_GROUP_BY: WidgetGroupBy = "countries";
const DEFAULT_PRICING: WidgetPricingMode = "default";
const DEFAULT_SORT_BY: WidgetSortBy = "price";
const DEFAULT_THEME: WidgetTheme = "default";
const DEFAULT_NIGHTS = [7];
const DEFAULT_TIMEFRAME: WidgetTimeframeConfig = {
  fluid: ["P14D", "P115D"],
  monthly: true
};

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

export function normalizeTimeframe(value: unknown): WidgetTimeframeConfig {
  if (!isPlainObject(value)) {
    return { ...DEFAULT_TIMEFRAME };
  }

  const fixed = value.fixed;
  const fluid = value.fluid;
  const monthly = value.monthly === true;

  if (Array.isArray(fixed) && fixed.length) {
    if (fixed.length === 2 && fixed.every((entry) => typeof entry === "string")) {
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

export function normalizeNights(value: unknown, fallback: number[] = DEFAULT_NIGHTS) {
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
