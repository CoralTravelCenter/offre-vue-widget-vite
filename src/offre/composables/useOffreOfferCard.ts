import { computed, toValue, type MaybeRefOrGetter } from "vue";
import type { B2COffer, B2CPriceSearchReference, B2CProduct } from "offre/api/types";
import {
  resolveHotelImageUrl,
  resolveOfferHref
} from "offre/lib/product-offer";
import { useOffreOfferPricing } from "offre/composables/useOffreOfferPricing";
import { useOffreOfferTerms } from "offre/composables/useOffreOfferTerms";
import type { OffreHotelRuntimeEntry, OffreTourType } from "offre/types";

interface OffreOfferCardHotelCategory {
  name?: string;
  starCount?: number;
}

function stripEnglishBracketFragments(value: string | undefined) {
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

  const hotelCategory = computed(() => {
    return getReferenceValue<OffreOfferCardHotelCategory>(
      productReference.value,
      "hotelCategories",
      hotel.value.categoryKey
    );
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

  const {
    terms
  } = useOffreOfferTerms({
    offer,
    productReference,
    selectedDepartureName
  });

  const {
    currentPriceValue,
    currentPriceLabel,
    oldPriceLabel,
    priceSuffix,
    discountPercent
  } = useOffreOfferPricing({
    offer,
    pricingMode: () => toValue(params.pricingMode)
  });

  const hotelName = computed(() => {
    return stripEnglishBracketFragments(hotel.value.name) || "Без названия";
  });
  const locationLabel = computed(() => stripEnglishBracketFragments(hotel.value.locationSummary));
  const hotelCategoryName = computed(() => hotelCategory.value?.name ?? "");
  const hotelStarCount = computed(() => Number(hotelCategory.value?.starCount) || 0);
  const isRecommended = computed(() => Boolean(hotel.value.recommended));
  const isExclusive = computed(() => Boolean(hotel.value.exclusive));
  const isEliteHotel = computed(() => Boolean(hotel.value.eliteHotel));
  const hasFamilyClub = computed(() => Boolean(hotel.value.sunFamilyClub || hotel.value.coralFamilyClub));

  return {
    hotelName,
    hotelCategoryName,
    hotelStarCount,
    locationLabel,
    imageUrl,
    offerHref,
    hasOfferHref,
    hotelUsps,
    terms,
    currentPriceValue,
    currentPriceLabel,
    oldPriceLabel,
    priceSuffix,
    discountPercent,
    isRecommended,
    isExclusive,
    isEliteHotel,
    hasFamilyClub,
    isHotelOnly
  };
}
