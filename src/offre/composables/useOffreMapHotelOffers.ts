import { useQueryClient } from "@tanstack/vue-query";
import { computed, ref, shallowRef, toValue, type MaybeRefOrGetter, watch } from "vue";
import { hotelPriceSearchList } from "@/offre/api";
import type { B2COffer, B2CProduct } from "@/offre/api";
import { buildHotelOfferSearchCriterias } from "@/offre/lib/hotel-offer";
import type { NormalizedOffreWidgetOptions } from "@/offre/lib/payload";
import { getPrimaryMapOffer } from "@/offre/lib/offre-map";
import { offreQueryConfig, offreQueryKeys } from "@/offre/query";
import { runConcurrentTasks } from "@/lib/concurrency";

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
  const loadingHotelIds = shallowRef(new Set<string>());
  const mapOfferLoading = ref(false);

  watch(
    [products, searchOptions, mapOfferMode],
    async ([nextProducts, nextSearchOptions, offerMode], _previous, onCleanup) => {
      let cancelled = false;
      onCleanup(() => {
        cancelled = true;
      });

      if (offerMode !== "hotel") {
        hotelOffersByHotelId.value = new Map();
        loadingHotelIds.value = new Set();
        mapOfferLoading.value = false;
        return;
      }

      const nextMap = new Map<string, B2COffer | null>();
      const nextLoadingHotelIds = new Set<string>();
      const tasks = nextProducts.flatMap((product, index) => {
        const hotelId = String(product.hotel?.id ?? product.hotel?.name ?? index);

        const searchCriterias = buildHotelOfferSearchCriterias({
          hotel: product.hotel,
          packageOffer: getPrimaryMapOffer(product),
          searchOptions: nextSearchOptions
        });

        if (!searchCriterias) {
          nextMap.set(hotelId, null);
          return [];
        }

        nextLoadingHotelIds.add(hotelId);

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

            return {
              hotelId,
              hotelOffer,
              hasError: false
            } as const;
          } catch {
            return {
              hotelId,
              hotelOffer: null,
              hasError: true
            } as const;
          }
        }];
      });

      hotelOffersByHotelId.value = nextMap;
      loadingHotelIds.value = nextLoadingHotelIds;

      if (!tasks.length) {
        mapOfferLoading.value = false;
        return;
      }

      mapOfferLoading.value = true;
      await runConcurrentTasks(tasks.map((task) => {
        return async () => {
          const nextEntry = await task();

          if (cancelled) {
            return nextEntry;
          }

          const nextResolvedLoadingHotelIds = new Set(loadingHotelIds.value);
          nextResolvedLoadingHotelIds.delete(nextEntry.hotelId);
          loadingHotelIds.value = nextResolvedLoadingHotelIds;

          if (!nextEntry.hasError) {
            const nextResolvedOfferMap = new Map(hotelOffersByHotelId.value);
            nextResolvedOfferMap.set(nextEntry.hotelId, nextEntry.hotelOffer);
            hotelOffersByHotelId.value = nextResolvedOfferMap;
          }

          return nextEntry;
        };
      }), MAP_HOTEL_OFFERS_CONCURRENCY);

      if (cancelled) {
        return;
      }
      loadingHotelIds.value = new Set();
      mapOfferLoading.value = false;
    },
    { immediate: true }
  );

  return {
    mapOfferMode,
    hotelOffersByHotelId,
    loadingHotelIds,
    mapOfferLoading
  };
}
