import type {
  B2CAdditionalFilter,
  B2CArrivalLocationCriteria,
  B2CLocation,
  B2CPriceSearchCriterias
} from "offre/api/types";
import type { NormalizedOffreWidgetOptions } from "offre/lib/payload";
import type { B2CHotelInfo } from "offre/api/types";
import type { OffreHotelRuntimeEntry } from "offre/types";
import { stableStringify } from "shared/lib/stable-stringify";

const PACKAGE_COMMON_SEARCH_CRITERIAS = {
  datePickerMode: 0,
  roomCriterias: [{
    passengers: [
      { age: 20, passengerType: 0 },
      { age: 20, passengerType: 0 }
    ]
  }],
  reservationType: 1 as const,
  imageSizes: [4, 7]
};

const HOTEL_COMMON_SEARCH_CRITERIAS = {
  reservationType: 2 as const,
  roomCriterias: [{
    passengers: [
      { age: 20, passengerType: 0 },
      { age: 20, passengerType: 0 }
    ]
  }]
};

export interface OffreProductQueryDescriptor {
  onlyhotel: boolean;
  searchCriterias: B2CPriceSearchCriterias;
}

function createArrivalLocationKey(location: B2CArrivalLocationCriteria) {
  return `${location.type}:${location.id}`;
}

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

function toArrivalLocationCriteria(hotelInfo: B2CHotelInfo): B2CArrivalLocationCriteria | null {
  if (!hotelInfo.location?.id || !hotelInfo.location.type) {
    return null;
  }

  return {
    id: hotelInfo.location.id,
    type: hotelInfo.location.type
  };
}

export function buildOffreProductQueries(params: {
  hotels: OffreHotelRuntimeEntry[];
  hotelInfoById: Map<string, B2CHotelInfo>;
  selectedTimeframe: string;
  selectedDeparture: B2CLocation | null;
  options: NormalizedOffreWidgetOptions;
}) {
  const groupedQueries = new Map<string, OffreProductQueryDescriptor>();

  for (const hotel of params.hotels) {
    const matchedTimeframe = hotel.timeframes.find((timeframe) => timeframe.key === params.selectedTimeframe);

    if (!matchedTimeframe) {
      continue;
    }

    const hotelInfo = params.hotelInfoById.get(String(hotel.id));
    const arrivalLocation = hotelInfo ? toArrivalLocationCriteria(hotelInfo) : null;

    if (!arrivalLocation) {
      continue;
    }

    const groupKey = stableStringify({
      onlyhotel: hotel.onlyhotel,
      searchFields: matchedTimeframe.searchFields
    });
    const existingDescriptor = groupedQueries.get(groupKey);

    if (existingDescriptor) {
      const hasArrivalLocation = existingDescriptor.searchCriterias.arrivalLocations.some((existingLocation) => {
        return createArrivalLocationKey(existingLocation) === createArrivalLocationKey(arrivalLocation);
      });

      if (!hasArrivalLocation) {
        existingDescriptor.searchCriterias.arrivalLocations.push(arrivalLocation);
      }

      continue;
    }

    const additionalFilters = buildAdditionalFilters(params.options);
    const nights = matchedTimeframe.searchFields.nights.map((value) => ({ value }));

    if (hotel.onlyhotel) {
      groupedQueries.set(groupKey, {
        onlyhotel: true,
        searchCriterias: {
          ...HOTEL_COMMON_SEARCH_CRITERIAS,
          beginDates: matchedTimeframe.searchFields.beginDates,
          nights,
          arrivalLocations: [arrivalLocation],
          paging: {
            pageNumber: 1,
            pageSize: 1,
            sortType: 0
          },
          additionalFilters
        }
      });
      continue;
    }

    if (!params.selectedDeparture) {
      continue;
    }

    groupedQueries.set(groupKey, {
      onlyhotel: false,
      searchCriterias: {
        ...PACKAGE_COMMON_SEARCH_CRITERIAS,
        beginDates: matchedTimeframe.searchFields.beginDates,
        nights,
        departureLocations: [params.selectedDeparture],
        arrivalLocations: [arrivalLocation],
        paging: {
          pageNumber: 1,
          pageSize: 1,
          sortType: 0
        },
        flightType: params.options.chartersOnly ? 0 : 2,
        additionalFilters
      }
    });
  }

  return Array.from(groupedQueries.values()).map((descriptor) => {
    return {
      ...descriptor,
      searchCriterias: {
        ...descriptor.searchCriterias,
        paging: {
          ...descriptor.searchCriterias.paging,
          pageSize: descriptor.searchCriterias.arrivalLocations.length
        }
      }
    };
  });
}
