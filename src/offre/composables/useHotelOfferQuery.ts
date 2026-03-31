import { useQuery } from "@tanstack/vue-query";
import { computed, toValue, type MaybeRefOrGetter } from "vue";
import { hotelPriceSearchList } from "offre/api/client";
import type { B2CAdditionalFilter, B2COffer, B2CHotelSearchCriterias, B2CProductHotel } from "offre/api/types";
import type { NormalizedOffreWidgetOptions } from "offre/lib/payload";
import { offreQueryConfig } from "offre/query/config";
import { offreQueryKeys } from "offre/query/keys";
import { offreQueryPersisters } from "offre/query/persister";

const DEFAULT_HOTEL_OFFER_ROOM_CRITERIAS = [{
  passengers: [
    { age: 20, passengerType: 0 },
    { age: 20, passengerType: 0 }
  ]
}];

function buildAdditionalFilters(options: NormalizedOffreWidgetOptions): B2CAdditionalFilter[] {
  const maxPrice = Number(options.maxPrice);

  if (!Number.isFinite(maxPrice) || maxPrice <= 0) {
    return [];
  }

  return [{
    type: 15,
    values: [{ id: "", value: `0-${maxPrice.toFixed(0)}` }],
    providers: []
  }];
}

const HOTEL_OFFER_COMMON_SEARCH_CRITERIAS = {
  reservationType: 2 as const,
  roomCriterias: DEFAULT_HOTEL_OFFER_ROOM_CRITERIAS
};

function buildHotelOfferSearchCriterias(params: {
  hotel: B2CProductHotel | undefined;
  packageOffer: B2COffer | null;
  searchOptions: NormalizedOffreWidgetOptions;
}) {
  const { hotel, packageOffer, searchOptions } = params;
  const locationId = hotel?.location?.id;
  const locationType = hotel?.location?.type;
  const checkInDate = packageOffer?.checkInDate;
  const stayNights = Number(packageOffer?.stayNights);

  if (!locationId || !locationType || !checkInDate || !Number.isFinite(stayNights) || stayNights <= 0) {
    return null;
  }

  const searchCriterias: B2CHotelSearchCriterias = {
    ...HOTEL_OFFER_COMMON_SEARCH_CRITERIAS,
    roomCriterias: Array.isArray(searchOptions.roomCriterias) && searchOptions.roomCriterias.length > 0
      ? searchOptions.roomCriterias
      : DEFAULT_HOTEL_OFFER_ROOM_CRITERIAS,
    beginDates: [checkInDate, checkInDate],
    nights: [{ value: stayNights }],
    arrivalLocations: [{ id: locationId, type: locationType }],
    paging: {
      pageNumber: 1,
      pageSize: 1,
      sortType: 0
    },
    additionalFilters: buildAdditionalFilters(searchOptions)
  };

  return searchCriterias;
}

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
