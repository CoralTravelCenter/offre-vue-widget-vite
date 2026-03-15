import type { B2CHotelImage } from "offre/api/types";

const PRICE_SUFFIX_MAP = {
  "per-person": " / за одного",
  "per-night": " / за ночь",
  default: " / за двоих"
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
  return PRICE_SUFFIX_MAP[normalizedPricingOption] ?? PRICE_SUFFIX_MAP.default;
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

  return `${day}/${month}/${year}`;
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
