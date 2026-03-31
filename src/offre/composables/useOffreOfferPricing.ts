import { computed, toValue, type MaybeRefOrGetter } from "vue";
import type { B2COffer } from "offre/api/types";
import {
  formatCurrencySafe,
  resolveOfferPriceValue,
  resolveOfferPartySuffix
} from "offre/lib/product-offer";

export function useOffreOfferPricing(params: {
  offer: MaybeRefOrGetter<B2COffer | null>;
  pricingMode: MaybeRefOrGetter<unknown>;
}) {
  const offer = computed(() => toValue(params.offer));

  const passengersCount = computed(() => {
    return offer.value?.rooms?.[0]?.passengers?.length || 1;
  });
  const roomPassengers = computed(() => {
    return offer.value?.rooms?.[0]?.passengers ?? [];
  });
  const stayNights = computed(() => {
    return Number(offer.value?.stayNights) || 1;
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

    return resolveOfferPartySuffix(
      toValue(params.pricingMode),
      roomPassengers.value
    );
  });

  const discountPercent = computed(() => {
    const value = Number(offer.value?.price?.discountPercent);
    return Number.isFinite(value) && value > 0 ? value : 0;
  });

  return {
    currentPriceValue,
    oldPriceValue,
    currentPriceLabel,
    oldPriceLabel,
    priceSuffix,
    discountPercent
  };
}
