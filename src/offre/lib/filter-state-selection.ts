import type { B2CHotelInfo } from "@/offre/api";
import { normalizeOffreRegionLabelForCompare } from "@/offre/lib/region-labels";
import type { NormalizedOffreWidgetOptions } from "@/offre/lib/payload";
import type {
  OffreDepartureOption,
  OffreHotelRuntimeEntry,
  OffreRegionOption
} from "@/offre/types";
import { WILDCARD_REGION_ID } from "@/offre/lib/filter-state-types";
import type { HotelLocationField } from "@/offre/lib/filter-state-types";

export function resolvePreferredDepartureId(
  departures: OffreDepartureOption[],
  requestedDepartureCity: string | undefined
) {
  const requestedCity = String(requestedDepartureCity ?? "").trim().toLowerCase();

  if (requestedCity) {
    const preferredDeparture = departures.find((departure) => departure.label.toLowerCase() === requestedCity);

    if (preferredDeparture) {
      return preferredDeparture.id;
    }
  }

  const currentDeparture = departures.find((departure) => departure.isCurrent);

  if (currentDeparture) {
    return currentDeparture.id;
  }

  return departures[0]?.id ?? "";
}

export function resolvePreferredRegionId(
  regions: OffreRegionOption[],
  wildcardOption: string | undefined,
  preferRegion: string | undefined
) {
  if (!regions.length) {
    return "";
  }

  const preferredRegionLabel = normalizeOffreRegionLabelForCompare(preferRegion);

  if (preferredRegionLabel) {
    const preferredRegion = regions.find((region) => {
      return normalizeOffreRegionLabelForCompare(region.label) === preferredRegionLabel;
    });

    if (preferredRegion) {
      return preferredRegion.id;
    }
  }

  if (wildcardOption) {
    return WILDCARD_REGION_ID;
  }

  return regions[0]?.id ?? "";
}

export function filterMatchedHotels(params: {
  hotelsDirectory: OffreHotelRuntimeEntry[];
  hotelInfoById: Map<string, B2CHotelInfo>;
  selectedTimeframe: string;
  selectedRegionId: string;
  groupBy: NormalizedOffreWidgetOptions["groupBy"];
}) {
  if (!params.selectedTimeframe || params.hotelInfoById.size === 0) {
    return [] as OffreHotelRuntimeEntry[];
  }

  const locationFieldByGroup: Record<NormalizedOffreWidgetOptions["groupBy"], HotelLocationField> = {
    countries: "countryKey",
    regions: "regionKey",
    areas: "areaKey",
    places: "placeKey"
  };
  const locationField = locationFieldByGroup[params.groupBy];

  return params.hotelsDirectory.filter((hotel) => {
    const hotelInfo = params.hotelInfoById.get(String(hotel.id));

    if (!hotelInfo) {
      return false;
    }

    const hasTimeframe = hotel.timeframes.some((timeframe) => timeframe.key === params.selectedTimeframe);

    if (!hasTimeframe) {
      return false;
    }

    if (params.selectedRegionId === WILDCARD_REGION_ID) {
      return true;
    }

    return String(hotelInfo[locationField] ?? "") === params.selectedRegionId;
  });
}
