import { computed, toValue, type MaybeRefOrGetter, type WritableComputedRef } from "vue";
import type { B2CPriceSearchReference, B2CProduct } from "@/offre/api";
import { useCoralBonus } from "@/offre/composables/useCoralBonus";
import { useHotelOfferQuery } from "@/offre/composables/useHotelOfferQuery";
import { useOffreOfferCard } from "@/offre/composables/useOffreOfferCard";
import type { BrandKey } from "@/brands/types";
import type { NormalizedOffreWidgetOptions } from "@/offre/lib/payload";
import type { OffreHotelRuntimeEntry, OffreTourType } from "@/offre/types";

export function useOffreOfferCardState(params: {
  productSource: MaybeRefOrGetter<B2CProduct>;
  productReferenceSource: MaybeRefOrGetter<B2CPriceSearchReference>;
  selectedDepartureNameSource: MaybeRefOrGetter<string>;
  pricingModeSource: MaybeRefOrGetter<unknown>;
  searchOptionsSource: MaybeRefOrGetter<NormalizedOffreWidgetOptions>;
  hotelRuntimeEntrySource: MaybeRefOrGetter<OffreHotelRuntimeEntry | null>;
  selectedTourTypeRef: WritableComputedRef<OffreTourType>;
  brandKeySource: MaybeRefOrGetter<BrandKey>;
}) {
  const product = computed(() => toValue(params.productSource));
  const hotelRuntimeEntry = computed(() => toValue(params.hotelRuntimeEntrySource));
  const baseOffer = computed(() => product.value.offers?.[0] ?? null);
  const isHotelOnly = computed(() => Boolean(hotelRuntimeEntry.value?.onlyhotel));

  const {
    hotelOffer,
    hotelOfferQuery
  } = useHotelOfferQuery({
    hotelSource: () => product.value.hotel,
    packageOfferSource: baseOffer,
    searchOptionsSource: params.searchOptionsSource,
    enabledSource: computed(() => params.selectedTourTypeRef.value === "hotel" && !isHotelOnly.value)
  });

  const effectiveOffer = computed(() => {
    if (params.selectedTourTypeRef.value === "hotel") {
      return hotelOffer.value ?? baseOffer.value;
    }

    return baseOffer.value;
  });

  const hotelOfferLoading = computed(() => {
    return params.selectedTourTypeRef.value === "hotel" && hotelOfferQuery.isPending.value;
  });

  const card = useOffreOfferCard({
    product,
    offer: effectiveOffer,
    productReference: params.productReferenceSource,
    selectedDepartureName: params.selectedDepartureNameSource,
    pricingMode: params.pricingModeSource,
    tourType: params.selectedTourTypeRef,
    hotelRuntimeEntry
  });

  const { cashbackInfo } = useCoralBonus({
    brandKey: params.brandKeySource,
    hotel: () => product.value.hotel,
    offer: effectiveOffer,
    hotelStarCount: card.hotelStarCount,
    currentPriceValue: card.currentPriceValue,
    tourType: params.selectedTourTypeRef,
    isHotelOnly
  });

  const starItems = computed(() => {
    return Array.from({ length: card.hotelStarCount.value }, () => true);
  });

  const hasLabels = computed(() => card.isEliteHotel.value || card.hasFamilyClub.value);
  const hasUsps = computed(() => card.hotelUsps.value.length > 0);

  return {
    ...card,
    baseOffer,
    effectiveOffer,
    hotelOffer,
    hotelOfferLoading,
    isHotelOnly,
    cashbackInfo,
    starItems,
    hasLabels,
    hasUsps
  };
}
