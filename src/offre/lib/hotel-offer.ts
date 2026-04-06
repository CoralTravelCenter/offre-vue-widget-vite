import type {
  B2CAdditionalFilter,
  B2COffer,
  B2CHotelSearchCriterias,
  B2CProductHotel
} from "offre/api/types";
import type { NormalizedOffreWidgetOptions } from "offre/lib/payload";

export const DEFAULT_HOTEL_OFFER_ROOM_CRITERIAS = [{
  passengers: [
    { age: 20, passengerType: 0 },
    { age: 20, passengerType: 0 }
  ]
}];

export function buildHotelOfferAdditionalFilters(options: NormalizedOffreWidgetOptions): B2CAdditionalFilter[] {
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

export function buildHotelOfferSearchCriterias(params: {
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
    additionalFilters: buildHotelOfferAdditionalFilters(searchOptions)
  };

  return searchCriterias;
}
