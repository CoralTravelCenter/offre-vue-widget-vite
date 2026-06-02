import { computed, toValue, type MaybeRefOrGetter } from "vue";
import type { B2CProduct } from "@/offre/api";
import type { OffreHotelRuntimeEntry, OffreTourType } from "@/offre/types";

export function resolveOfferListHotelId(product: B2CProduct) {
  return String(product.hotel?.id ?? "");
}

export function resolveOfferListEntryKey(product: B2CProduct, index: number) {
  return String(product.hotel?.id ?? product.hotel?.name ?? `product-${index}`);
}

export function useOffreOffersListState(params: {
  productsSource: MaybeRefOrGetter<B2CProduct[]>;
  hotelRuntimeByIdSource: MaybeRefOrGetter<Map<string, OffreHotelRuntimeEntry>>;
  tourTypeByHotelIdSource: MaybeRefOrGetter<Record<string, OffreTourType>>;
}) {
  const normalizedProducts = computed(() => {
    const hotelRuntimeById = toValue(params.hotelRuntimeByIdSource);
    const tourTypeByHotelId = toValue(params.tourTypeByHotelIdSource);

    return toValue(params.productsSource).map((product, index) => {
      const hotelId = resolveOfferListHotelId(product);

      return {
        key: resolveOfferListEntryKey(product, index),
        hotelId,
        product,
        hotelRuntimeEntry: hotelRuntimeById.get(hotelId) ?? null,
        tourType: tourTypeByHotelId[hotelId]
      };
    });
  });

  return {
    normalizedProducts
  };
}
