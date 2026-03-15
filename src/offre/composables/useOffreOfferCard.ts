import { computed, toValue, type MaybeRefOrGetter } from "vue";
import { getCityGenitiveCase } from "app/plugins/city-spelling";
import type { B2COffer, B2CPriceSearchReference, B2CProduct } from "offre/api/types";
import {
  formatCurrencySafe,
  formatOfferDate,
  normalizePricingOption,
  pluralizeNights,
  resolveHotelImageUrl,
  resolveOfferHref,
  resolveOfferPriceValue,
  resolvePriceSuffix
} from "offre/lib/product-offer";
import type { OffreHotelRuntimeEntry, OffreTourType } from "offre/types";

export type OffreOfferCardTermIcon = "flight" | "calendar" | "bed" | "meal";

export interface OffreOfferCardTerm {
  key: string;
  icon: OffreOfferCardTermIcon;
  value: string;
}

interface OffreOfferCardReferenceValue {
  name?: string;
}

interface OffreOfferCardHotelCategory {
  name?: string;
  starCount?: number;
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

function getReferenceValue<TValue extends object>(
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

export function useOffreOfferCard(params: {
  product: MaybeRefOrGetter<B2CProduct>;
  offer: MaybeRefOrGetter<B2COffer | null>;
  productReference: MaybeRefOrGetter<B2CPriceSearchReference>;
  selectedDepartureName: MaybeRefOrGetter<string>;
  pricingMode: MaybeRefOrGetter<unknown>;
  tourType: MaybeRefOrGetter<OffreTourType>;
  hotelRuntimeEntry: MaybeRefOrGetter<OffreHotelRuntimeEntry | null>;
}) {
  const product = computed(() => toValue(params.product));
  const productReference = computed(() => toValue(params.productReference) ?? {});
  const selectedDepartureName = computed(() => String(toValue(params.selectedDepartureName) ?? "").trim());
  const tourType = computed(() => toValue(params.tourType));
  const hotelRuntimeEntry = computed(() => toValue(params.hotelRuntimeEntry));
  const hotel = computed(() => product.value.hotel ?? {});
  const offer = computed(() => toValue(params.offer));

  const passengersCount = computed(() => {
    return offer.value?.rooms?.[0]?.passengers?.length || 1;
  });

  const stayNights = computed(() => {
    return Number(offer.value?.stayNights) || 1;
  });

  const hotelCategory = computed(() => {
    return getReferenceValue<OffreOfferCardHotelCategory>(
      productReference.value,
      "hotelCategories",
      hotel.value.categoryKey
    );
  });

  const mealType = computed(() => {
    const meal = getReferenceValue<OffreOfferCardReferenceValue>(
      productReference.value,
      "meals",
      offer.value?.rooms?.[0]?.mealKey
    );

    return meal?.name ?? "";
  });

  const isHotelOnly = computed(() => Boolean(hotelRuntimeEntry.value?.onlyhotel));
  const hotelUsps = computed(() => hotelRuntimeEntry.value?.usps ?? []);
  const imageUrl = computed(() => resolveHotelImageUrl(hotel.value.images));
  const offerHref = computed(() => {
    return resolveOfferHref({
      redirectionUrl: offer.value?.link?.redirectionUrl,
      queryParam: offer.value?.link?.queryParam,
      isHotelOnly: isHotelOnly.value,
      tourType: tourType.value,
      hostname: typeof window === "undefined" ? "" : window.location.hostname
    });
  });
  const hasOfferHref = computed(() => offerHref.value !== "#");

  const beginDate = computed(() => {
    return formatOfferDate(offer.value?.flight?.flightDate || offer.value?.checkInDate);
  });

  const departureTerm = computed(() => {
    if (!offer.value?.flight || !selectedDepartureName.value) {
      return "";
    }

    return `из ${getCityGenitiveCase(selectedDepartureName.value)}`;
  });

  const stayNightsTerm = computed(() => {
    if (!offer.value?.stayNights) {
      return "";
    }

    return `${offer.value.stayNights} ${pluralizeNights(offer.value.stayNights)}`;
  });

  const currentPriceValue = computed(() => {
    return resolveOfferPriceValue(
      offer.value?.price?.amount,
      toValue(params.pricingMode),
      passengersCount.value,
      stayNights.value
    );
  });

  const oldPriceValue = computed(() => {
    return resolveOfferPriceValue(
      offer.value?.price?.oldAmount,
      toValue(params.pricingMode),
      passengersCount.value,
      stayNights.value
    );
  });

  const currentPriceLabel = computed(() => formatCurrencySafe(currentPriceValue.value));
  const oldPriceLabel = computed(() => formatCurrencySafe(oldPriceValue.value));
  const priceSuffix = computed(() => {
    if (!currentPriceLabel.value) {
      return "";
    }

    return resolvePriceSuffix(toValue(params.pricingMode));
  });

  const hotelName = computed(() => hotel.value.name ?? "Без названия");
  const locationLabel = computed(() => hotel.value.locationSummary ?? "");
  const hotelCategoryName = computed(() => hotelCategory.value?.name ?? "");
  const hotelStarCount = computed(() => Number(hotelCategory.value?.starCount) || 0);
  const isRecommended = computed(() => Boolean(hotel.value.recommended));
  const isExclusive = computed(() => Boolean(hotel.value.exclusive));
  const isEliteHotel = computed(() => Boolean(hotel.value.eliteHotel));
  const hasFamilyClub = computed(() => Boolean(hotel.value.sunFamilyClub || hotel.value.coralFamilyClub));
  const discountPercent = computed(() => {
    const value = Number(offer.value?.price?.discountPercent);
    return Number.isFinite(value) && value > 0 ? value : 0;
  });

  const terms = computed<OffreOfferCardTerm[]>(() => {
    const nextTerms: OffreOfferCardTerm[] = [];

    if (departureTerm.value) {
      nextTerms.push({
        key: "departure",
        icon: "flight",
        value: departureTerm.value
      });
    }

    if (beginDate.value) {
      nextTerms.push({
        key: "begin-date",
        icon: "calendar",
        value: beginDate.value
      });
    }

    if (stayNightsTerm.value) {
      nextTerms.push({
        key: "stay-nights",
        icon: "bed",
        value: stayNightsTerm.value
      });
    }

    if (mealType.value) {
      nextTerms.push({
        key: "meal",
        icon: "meal",
        value: mealType.value
      });
    }

    return nextTerms;
  });

  return {
    hotel,
    offer,
    hotelName,
    hotelCategoryName,
    hotelStarCount,
    locationLabel,
    imageUrl,
    offerHref,
    hasOfferHref,
    hotelUsps,
    mealType,
    beginDate,
    terms,
    currentPriceLabel,
    oldPriceLabel,
    priceSuffix,
    discountPercent,
    isRecommended,
    isExclusive,
    isEliteHotel,
    hasFamilyClub,
    isHotelOnly,
    normalizedPricingOption: computed(() => normalizePricingOption(toValue(params.pricingMode)))
  };
}
