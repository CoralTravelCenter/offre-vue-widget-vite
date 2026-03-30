import { computed, shallowRef, toValue, watch, type MaybeRefOrGetter } from "vue";
import type { B2COffer, B2CProductHotel } from "offre/api/types";
import { calculateCoralBonus, type CoralBonusInfo } from "offre/lib/coral-bonus";
import type { OffreTourType } from "offre/types";
import type { BrandKey } from "shared/types/brand";

export function useCoralBonus(params: {
  brandKey: MaybeRefOrGetter<BrandKey>;
  hotel: MaybeRefOrGetter<B2CProductHotel | undefined>;
  offer: MaybeRefOrGetter<B2COffer | null>;
  hotelStarCount: MaybeRefOrGetter<number>;
  currentPriceValue: MaybeRefOrGetter<number>;
  tourType: MaybeRefOrGetter<OffreTourType>;
  isHotelOnly: MaybeRefOrGetter<boolean>;
}) {
  const cashbackInfo = shallowRef<CoralBonusInfo | null>(null);
  const isEnabled = computed(() => toValue(params.brandKey) === "coral");

  watch([
    isEnabled,
    () => toValue(params.hotel),
    () => toValue(params.offer),
    () => toValue(params.hotelStarCount),
    () => toValue(params.currentPriceValue),
    () => toValue(params.tourType),
    () => toValue(params.isHotelOnly)
  ], async () => {
    if (!isEnabled.value) {
      cashbackInfo.value = null;
      return;
    }

    const hotel = toValue(params.hotel);
    const offer = toValue(params.offer);
    const currentPriceValue = Number(toValue(params.currentPriceValue));

    if (!hotel?.id || !offer || !Number.isFinite(currentPriceValue) || currentPriceValue <= 0) {
      cashbackInfo.value = null;
      return;
    }

    cashbackInfo.value = await calculateCoralBonus({
      id: hotel.id,
      night: offer.stayNights,
      day: offer.stayNights,
      star: toValue(params.hotelStarCount),
      price: currentPriceValue,
      checkInDate: offer.checkInDate,
      name: hotel.name,
      countryID: hotel.countryKey ?? hotel.location?.parent?.countryId,
      isOnlyHotel: Boolean(toValue(params.isHotelOnly) || toValue(params.tourType) === "hotel")
    });
  }, { immediate: true });

  return {
    cashbackInfo
  };
}
