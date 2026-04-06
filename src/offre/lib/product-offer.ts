import type { B2CHotelImage, B2COfferRoomPassenger } from "offre/api/types";

const PRICE_SUFFIX_MAP = {
  "per-person": "за 1 взрослого",
  "per-night": "за ночь",
  default: "за 2 взрослых"
} as const;

const PRICING_ALIASES = Object.freeze({
  "per-person": "per-person",
  perperson: "per-person",
  per_person: "per-person",
  perpassenger: "per-person",
  passenger: "per-person",
  pax: "per-person",
  person: "per-person",
  "per person": "per-person",
  "per-night": "per-night",
  pernight: "per-night",
  per_night: "per-night",
  pernights: "per-night",
  perday: "per-night",
  night: "per-night",
  "per night": "per-night",
  default: "default"
} as const);

type PricingOption = "default" | "per-person" | "per-night";

const priceFormatter = new Intl.NumberFormat("ru-RU", {
  maximumFractionDigits: 0
});

function normalizePriceValue(value: number | string | undefined) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

export function stripEnglishBracketFragments(value: string | undefined) {
  const source = String(value ?? "").trim();

  if (!source) {
    return "";
  }

  const normalized = source
    .replace(/\s*\(([A-Za-z0-9\s.'&,/+-]+)\)\s*/g, " ")
    .replace(/\s*,\s*/g, ", ")
    .replace(/,\s*,+/g, ", ")
    .replace(/^,\s*|\s*,\s*$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  return normalized || source;
}

export function normalizePricingOption(value: unknown): PricingOption {
  const extractedValue = (
    value && typeof value === "object"
      ? (value as Record<string, unknown>).value
        ?? (value as Record<string, unknown>).id
        ?? (value as Record<string, unknown>).key
        ?? (value as Record<string, unknown>).name
        ?? (value as Record<string, unknown>).label
      : value
  );
  const raw = String(extractedValue ?? "default").trim().toLowerCase();

  if (raw in PRICING_ALIASES) {
    return PRICING_ALIASES[raw as keyof typeof PRICING_ALIASES];
  }

  if (raw.includes("person") || raw.includes("passenger") || raw.includes("pax") || raw.includes("чел")) {
    return "per-person";
  }

  if (raw.includes("night") || raw.includes("day") || raw.includes("ноч")) {
    return "per-night";
  }

  return "default";
}

export function formatCurrencySafe(value: number | string | undefined) {
  const amount = normalizePriceValue(value);

  if (amount <= 0) {
    return "";
  }

  return `${priceFormatter.format(amount)} ₽`;
}

export function resolvePriceSuffix(pricingOption: unknown) {
  const normalizedPricingOption = normalizePricingOption(pricingOption);

  switch (normalizedPricingOption) {
    case "per-person":
      return PRICE_SUFFIX_MAP["per-person"];
    case "per-night":
      return PRICE_SUFFIX_MAP["per-night"];
    default:
      return PRICE_SUFFIX_MAP.default;
  }
}

function resolvePassengerPartyLabel(passengers: B2COfferRoomPassenger[] | undefined) {
  const normalizedPassengers = Array.isArray(passengers) ? passengers : [];

  if (!normalizedPassengers.length) {
    return "за 2 взрослых";
  }

  const adultsCount = normalizedPassengers.filter((passenger) => Number(passenger?.passengerType) === 0).length;
  const childrenCount = normalizedPassengers.length - adultsCount;
  return formatPassengerPartyText({
    adultsCount,
    childrenCount,
    prefix: "за ",
    separator: " и "
  });
}

function pluralizeByCount(value: number, forms: [string, string, string]) {
  const normalizedValue = Math.abs(Number(value)) % 100;
  const lastDigit = normalizedValue % 10;

  if (normalizedValue > 10 && normalizedValue < 20) {
    return forms[2];
  }

  if (lastDigit === 1) {
    return forms[0];
  }

  if (lastDigit > 1 && lastDigit < 5) {
    return forms[1];
  }

  return forms[2];
}

export function resolveOfferPartySuffix(
  pricingOption: unknown,
  passengers: B2COfferRoomPassenger[] | undefined
) {
  const normalizedPricingOption = normalizePricingOption(pricingOption);

  if (normalizedPricingOption === "per-night") {
    return PRICE_SUFFIX_MAP["per-night"];
  }

  return resolvePassengerPartyLabel(passengers);
}

export function formatPassengerPartyText(params: {
  adultsCount?: number;
  childrenCount?: number;
  prefix?: string;
  separator?: string;
}) {
  const {
    adultsCount = 0,
    childrenCount = 0,
    prefix = "",
    separator = ", "
  } = params;
  const parts: string[] = [];

  if (adultsCount > 0) {
    parts.push(`${adultsCount} ${pluralizeByCount(adultsCount, ["взрослого", "взрослых", "взрослых"])}`);
  }

  if (childrenCount > 0) {
    parts.push(`${childrenCount} ${childrenCount === 1 ? "ребенка" : "детей"}`);
  }

  if (parts.length === 0) {
    return `${prefix}2 взрослых`;
  }

  return `${prefix}${parts.join(separator)}`;
}

export function resolveOfferPriceValue(
  value: number | string | undefined,
  pricingOption: unknown,
  passengersCount: number,
  stayNights: number
) {
  const amount = normalizePriceValue(value);

  if (amount <= 0) {
    return 0;
  }

  switch (normalizePricingOption(pricingOption)) {
    case "per-person":
      return amount / Math.max(passengersCount, 1);
    case "per-night":
      return amount / Math.max(stayNights, 1);
    default:
      return amount;
  }
}

export function formatOfferDate(value: string | undefined) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}.${month}.${year}`;
}

export function pluralizeNights(value: number) {
  const normalizedValue = Math.abs(Number(value)) % 100;
  const lastDigit = normalizedValue % 10;

  if (normalizedValue > 10 && normalizedValue < 20) {
    return "ночей";
  }

  if (lastDigit > 1 && lastDigit < 5) {
    return "ночи";
  }

  if (lastDigit === 1) {
    return "ночь";
  }

  return "ночей";
}

export function resolveOfferHref(params: {
  redirectionUrl?: string;
  queryParam?: string;
  isHotelOnly?: boolean;
  tourType?: "package" | "hotel";
  hostname?: string;
}) {
  const { redirectionUrl, queryParam, isHotelOnly, tourType, hostname } = params;

  if (!redirectionUrl) {
    return "#";
  }

  const host = hostname === "localhost" ? "//coral.ru" : "";
  const urlFix = redirectionUrl.includes("/hotels") ? "" : "/hotels";
  const productType = (isHotelOnly || tourType === "hotel") ? 2 : 1;
  const queryString = queryParam ? `${queryParam}&p=${productType}` : `p=${productType}`;

  return `${host}${urlFix}${redirectionUrl}/?${queryString}`;
}

export function resolveHotelImageUrl(images: B2CHotelImage[] | undefined) {
  const sizes = images?.[0]?.sizes ?? [];
  return sizes.find((size) => size.type === 4)?.url ?? sizes[0]?.url ?? "";
}
