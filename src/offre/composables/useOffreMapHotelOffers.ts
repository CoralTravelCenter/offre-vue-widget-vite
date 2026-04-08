import { useQueryClient } from "@tanstack/vue-query";
import { computed, ref, shallowRef, toValue, type MaybeRefOrGetter, watch } from "vue";
import { hotelPriceSearchList } from "offre/api/client";
import type { B2COffer, B2CProduct } from "offre/api/types";
import { buildHotelOfferSearchCriterias } from "offre/lib/hotel-offer";
import type { NormalizedOffreWidgetOptions } from "offre/lib/payload";
import { getPrimaryMapOffer, runConcurrentMapTasks } from "offre/lib/offre-map";
import { offreQueryConfig } from "offre/query/config";
import { offreQueryKeys } from "offre/query/keys";

const MAP_HOTEL_OFFERS_CONCURRENCY = 6;

export function useOffreMapHotelOffers(params: {
  products: MaybeRefOrGetter<B2CProduct[]>;
  searchOptions: MaybeRefOrGetter<NormalizedOffreWidgetOptions>;
}) {
  const queryClient = useQueryClient();
  const products = computed(() => toValue(params.products));
  const searchOptions = computed(() => toValue(params.searchOptions));

  const mapOfferMode = ref<"package" | "hotel">("package");
  const hotelOffersByHotelId = shallowRef(new Map<string, B2COffer | null>());
  const mapOfferLoading = ref(false);

  watch(
    [products, searchOptions, mapOfferMode],
    async ([nextProducts, nextSearchOptions, offerMode], _previous, onCleanup) => {
      let cancelled = false;
      onCleanup(() => {
        cancelled = true;
      });

      if (offerMode !== "hotel") {
        mapOfferLoading.value = false;
        return;
      }

      const nextMap = new Map(hotelOffersByHotelId.value);
      const tasks = nextProducts.flatMap((product, index) => {
        const hotelId = String(product.hotel?.id ?? product.hotel?.name ?? index);

        if (nextMap.has(hotelId)) {
          return [];
        }

        const searchCriterias = buildHotelOfferSearchCriterias({
          hotel: product.hotel,
          packageOffer: getPrimaryMapOffer(product),
          searchOptions: nextSearchOptions
        });

        if (!searchCriterias) {
          nextMap.set(hotelId, null);
          return [];
        }

        return [async () => {
          try {
            const hotelOffer = await queryClient.fetchQuery({
              queryKey: offreQueryKeys.hotelOffer(searchCriterias),
              staleTime: offreQueryConfig.hotelOffer.staleTime,
              gcTime: offreQueryConfig.hotelOffer.gcTime,
              queryFn: async () => {
                const response = await hotelPriceSearchList(searchCriterias);
                return response.result.products?.[0]?.offers?.[0] ?? null;
              }
            });

            return [hotelId, hotelOffer] as const;
          } catch {
            return [hotelId, null] as const;
          }
        }];
      });

      if (!tasks.length) {
        hotelOffersByHotelId.value = nextMap;
        mapOfferLoading.value = false;
        return;
      }

      mapOfferLoading.value = true;
      const nextEntries = await runConcurrentMapTasks(tasks, MAP_HOTEL_OFFERS_CONCURRENCY);

      if (cancelled) {
        return;
      }

      nextEntries.forEach(([hotelId, hotelOffer]) => {
        nextMap.set(hotelId, hotelOffer);
      });

      hotelOffersByHotelId.value = nextMap;
      mapOfferLoading.value = false;
    },
    { immediate: true }
  );

  return {
    mapOfferMode,
    hotelOffersByHotelId,
    mapOfferLoading
  };
}
