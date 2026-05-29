import type { B2CHotelInfo, B2CLocation, B2CLocationDirectory } from "@/offre/api";
import { cleanOffreRegionLabel, normalizeOffreRegionLabelForCompare } from "@/offre/lib/region-labels";
import { buildHotelTimeframes } from "@/offre/lib/timeframes";
import type { NormalizedOffreWidgetOptions, NormalizedWidgetHotelDescriptor } from "@/offre/lib/payload";
import type {
  OffreDepartureOption,
  OffreHotelRuntimeEntry,
  OffreRegionOption,
  RegionTabItem
} from "@/offre/types";
import { formatDepartureLabel } from "@/offre/lib/filter-state-format";
import { WILDCARD_REGION_ID } from "@/offre/lib/filter-state-types";
import type { RegionDirectories } from "@/offre/lib/filter-state-types";

function resolveRegionDirectory(
  directories: RegionDirectories | undefined,
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
  directories: RegionDirectories | undefined;
  options: NormalizedOffreWidgetOptions;
}) {
  const directory = resolveRegionDirectory(params.directories, params.options.groupBy);
  const regionOrderRank = new Map(
    params.options.regionsOrder.map((entry, index) => [normalizeOffreRegionLabelForCompare(entry), index] as const)
  );
  const regions: OffreRegionOption[] = Object.entries(directory).map(([id, location]) => ({
    id,
    label: cleanOffreRegionLabel(location.name)
  }));

  if (regionOrderRank.size > 0) {
    regions.sort((left, right) => {
      const normalizedLeftIndex = regionOrderRank.get(normalizeOffreRegionLabelForCompare(left.label)) ?? Number.MAX_SAFE_INTEGER;
      const normalizedRightIndex = regionOrderRank.get(normalizeOffreRegionLabelForCompare(right.label)) ?? Number.MAX_SAFE_INTEGER;

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

export function getDepartureLocationsById(locations: B2CLocation[]) {
  return locations.reduce<Map<string, B2CLocation>>((accumulator, departure) => {
    accumulator.set(departure.id, departure);
    return accumulator;
  }, new Map<string, B2CLocation>());
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
