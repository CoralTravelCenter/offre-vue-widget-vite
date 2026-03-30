import { computed, toValue, type MaybeRefOrGetter } from "vue";
import { getCityGenitiveCase } from "app/plugins/city-spelling";
import type { B2COffer, B2CPriceSearchReference } from "offre/api/types";
import { formatOfferDate, pluralizeNights } from "offre/lib/product-offer";
import type { OffreOfferCardTerm } from "offre/types/offer-card";

interface OffreOfferCardReferenceValue {
  name?: string;
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

export function useOffreOfferTerms(params: {
  offer: MaybeRefOrGetter<B2COffer | null>;
  productReference: MaybeRefOrGetter<B2CPriceSearchReference>;
  selectedDepartureName: MaybeRefOrGetter<string>;
}) {
  const offer = computed(() => toValue(params.offer));
  const productReference = computed(() => toValue(params.productReference) ?? {});
  const selectedDepartureName = computed(() => String(toValue(params.selectedDepartureName) ?? "").trim());

  const mealType = computed(() => {
    const meal = getReferenceValue<OffreOfferCardReferenceValue>(
      productReference.value,
      "meals",
      offer.value?.rooms?.[0]?.mealKey
    );

    return meal?.name ?? "";
  });

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
    mealType,
    beginDate,
    terms
  };
}
