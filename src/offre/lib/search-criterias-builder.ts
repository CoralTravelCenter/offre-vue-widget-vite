import type {
  B2CHotelInfo,
  B2CLocation
} from "@/offre/api";
import type { NormalizedOffreWidgetOptions } from "@/offre/lib/payload";
import type { OffreHotelRuntimeEntry } from "@/offre/types";
import { stableStringify } from "@/lib/stable-stringify";
import {
  HOTEL_COMMON_SEARCH_CRITERIAS,
  PACKAGE_COMMON_SEARCH_CRITERIAS,
  resolveRoomCriterias
} from "@/offre/lib/search-criterias-common";
import {
  buildAdditionalFilters,
  createArrivalLocationKey,
  toArrivalLocationCriteria
} from "@/offre/lib/search-criterias-helpers";
import type { OffreProductQueryDescriptor } from "@/offre/lib/search-criterias-types";

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

      const hasHotel = existingDescriptor.hotels.some((entry) => entry.hotelId === String(hotel.id));

      if (!hasHotel) {
        existingDescriptor.hotels.push({
          hotelId: String(hotel.id),
          arrivalLocation
        });
      }

      continue;
    }

    const additionalFilters = buildAdditionalFilters(params.options);
    const nights = matchedTimeframe.searchFields.nights.map((value) => ({ value }));

    if (hotel.onlyhotel) {
      groupedQueries.set(groupKey, {
        hotels: [{
          hotelId: String(hotel.id),
          arrivalLocation
        }],
        onlyhotel: true,
        searchCriterias: {
          ...HOTEL_COMMON_SEARCH_CRITERIAS,
          roomCriterias: resolveRoomCriterias(params.options, HOTEL_COMMON_SEARCH_CRITERIAS.roomCriterias),
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
      hotels: [{
        hotelId: String(hotel.id),
        arrivalLocation
      }],
      onlyhotel: false,
      searchCriterias: {
        ...PACKAGE_COMMON_SEARCH_CRITERIAS,
        roomCriterias: resolveRoomCriterias(params.options, PACKAGE_COMMON_SEARCH_CRITERIAS.roomCriterias),
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
          pageSize: descriptor.hotels.length
        }
      }
    };
  });
}
