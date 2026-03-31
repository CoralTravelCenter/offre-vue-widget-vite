import { getCityCorrectName } from "app/plugins/city-spelling";
import type { B2CHotelInfo, B2CLocationDirectory } from "offre/api/types";
import { cleanOffreRegionLabel, normalizeOffreRegionLabelForCompare } from "offre/lib/region-labels";
import { buildHotelTimeframes } from "offre/lib/timeframes";
import type { NormalizedOffreWidgetOptions, NormalizedWidgetHotelDescriptor } from "offre/lib/payload";
import type {
  OffreDepartureOption,
  OffreHotelRuntimeEntry,
  OffreRegionOption,
  RegionTabItem
} from "offre/types";

export const WILDCARD_REGION_ID = "*";

type HotelLocationField = "countryKey" | "regionKey" | "areaKey" | "placeKey";

function capitalizeFirst(value: string) {
  const text = String(value ?? "").trim();

  if (!text) {
    return "";
  }

  return text[0].toLocaleUpperCase() + text.slice(1);
}

function formatDepartureLabel(name: string) {
  return capitalizeFirst(getCityCorrectName(name));
}

function resolveRegionDirectory(
  directories: {
    countries: B2CLocationDirectory;
    regions: B2CLocationDirectory;
    areas: B2CLocationDirectory;
    places: B2CLocationDirectory;
  } | undefined,
  groupBy: "countries" | "regions" | "areas" | "places"
) {
  if (!directories) {
    return {};
  }

  return directories[groupBy] ?? {};
}

export function buildHotelsDirectory(
  normalizedHotels: NormalizedWidgetHotelDescriptor[],
  options: NormalizedOffreWidgetOptions
) {
  return normalizedHotels.map<OffreHotelRuntimeEntry>((hotel) => ({
    id: hotel.id,
    onlyhotel: hotel.onlyhotel,
    usps: hotel.usps,
    roomCriterias: hotel.roomCriterias,
    timeframes: buildHotelTimeframes(hotel, options)
  }));
}

export function buildTimeframeOptions(hotelsDirectory: OffreHotelRuntimeEntry[]) {
  const uniqueTimeframes = new Set<string>();

  for (const hotel of hotelsDirectory) {
    for (const timeframe of hotel.timeframes) {
      uniqueTimeframes.add(timeframe.key);
    }
  }

  return Array.from(uniqueTimeframes).map((value) => ({
    value,
    label: value
  }));
}

export function buildRegionOptions(params: {
  directories:
    | {
      countries: B2CLocationDirectory;
      regions: B2CLocationDirectory;
      areas: B2CLocationDirectory;
      places: B2CLocationDirectory;
    }
    | undefined;
  options: NormalizedOffreWidgetOptions;
}) {
  const directory = resolveRegionDirectory(params.directories, params.options.groupBy);
  const normalizedRegionsOrder = params.options.regionsOrder.map((entry) => {
    return normalizeOffreRegionLabelForCompare(entry);
  });
  const regions: OffreRegionOption[] = Object.entries(directory).map(([id, location]) => ({
    id,
    label: cleanOffreRegionLabel(location.name)
  }));

  if (normalizedRegionsOrder.length > 0) {
    regions.sort((left, right) => {
      const leftIndex = normalizedRegionsOrder.indexOf(normalizeOffreRegionLabelForCompare(left.label));
      const rightIndex = normalizedRegionsOrder.indexOf(normalizeOffreRegionLabelForCompare(right.label));
      const normalizedLeftIndex = leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex;
      const normalizedRightIndex = rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex;

      return normalizedLeftIndex - normalizedRightIndex;
    });
  }

  if (typeof params.options.wildcardOption === "string" && params.options.wildcardOption.trim()) {
    return [{
      id: WILDCARD_REGION_ID,
      label: params.options.wildcardOption,
      wildcard: true
    }, ...regions];
  }

  return regions;
}

export function buildDepartureOptions(
  locations: Array<{ id: string; type: number; name: string; friendlyUrl?: string; isCurrent?: boolean }>
) {
  return locations.map<OffreDepartureOption>((location) => ({
    id: location.id,
    type: location.type,
    label: formatDepartureLabel(location.name),
    friendlyUrl: location.friendlyUrl,
    isCurrent: location.isCurrent
  }));
}

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

export function buildRegionTabs(regionOptions: OffreRegionOption[]): RegionTabItem[] {
  return regionOptions.map((region) => ({
    id: region.id,
    label: region.label
  }));
}

export function buildHotelInfoById(hotels: B2CHotelInfo[]) {
  const lookup = new Map<string, B2CHotelInfo>();

  for (const hotelInfo of hotels) {
    lookup.set(String(hotelInfo.id), hotelInfo);
  }

  return lookup;
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
