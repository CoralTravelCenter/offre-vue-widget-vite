import { useQuery } from "@tanstack/vue-query";
import { computed, toValue, type MaybeRefOrGetter } from "vue";
import { hotelPriceSearchList } from "@/offre/api";
import type { B2COffer, B2CProductHotel } from "@/offre/api";
import { buildHotelOfferSearchCriterias } from "@/offre/lib/hotel-offer";
import type { NormalizedOffreWidgetOptions } from "@/offre/lib/payload";
import { offreQueryConfig, offreQueryKeys, offreQueryPersisters } from "@/offre/query";

export function useHotelOfferQuery(params: {
  hotelSource: MaybeRefOrGetter<B2CProductHotel | undefined>;
  packageOfferSource: MaybeRefOrGetter<B2COffer | null>;
  searchOptionsSource: MaybeRefOrGetter<NormalizedOffreWidgetOptions>;
  enabledSource: MaybeRefOrGetter<boolean>;
}) {
  const searchCriterias = computed(() => {
    return buildHotelOfferSearchCriterias({
      hotel: toValue(params.hotelSource),
      packageOffer: toValue(params.packageOfferSource),
      searchOptions: toValue(params.searchOptionsSource)
    });
  });

  const hotelOfferQuery = useQuery({
    queryKey: computed(() => {
      return searchCriterias.value
        ? offreQueryKeys.hotelOffer(searchCriterias.value)
        : ["offre", "hotel-offer", "idle"] as const;
    }),
    enabled: computed(() => {
      return Boolean(toValue(params.enabledSource) && searchCriterias.value);
    }),
    staleTime: offreQueryConfig.hotelOffer.staleTime,
    gcTime: offreQueryConfig.hotelOffer.gcTime,
    persister: offreQueryPersisters.hotelOffer.persisterFn,
    queryFn: async ({ signal }) => {
      if (!searchCriterias.value) {
        return null;
      }

      const response = await hotelPriceSearchList(searchCriterias.value, { signal });
      return response.result.products?.[0]?.offers?.[0] ?? null;
    }
  });

  return {
    searchCriterias,
    hotelOfferQuery,
    hotelOffer: computed(() => hotelOfferQuery.data.value ?? null)
  };
}
