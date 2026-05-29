import { offreQueryKeys } from "@/offre/query";
import {
  buildDepartureOptions,
  buildHotelInfoById,
  buildHotelsDirectory,
  buildRegionOptions,
  buildRegionTabs,
  buildTimeframeOptions,
  filterMatchedHotels,
  getDepartureLocationsById,
  resolvePreferredDepartureId,
  resolvePreferredRegionId
} from "@/offre/lib/filter-state";
import { getWidgetHotelIds, type NormalizedOffreWidgetOptions, type NormalizedWidgetHotelDescriptor } from "@/offre/lib/payload";
import type {
  B2CHotelInfo,
  B2CHotelsInfoResult,
  B2CLocation,
  B2CListDepartureLocationsResult
} from "@/offre/api";

export function resolveHotelIds(normalizedHotels: NormalizedWidgetHotelDescriptor[]) {
  return getWidgetHotelIds(normalizedHotels);
}

export function buildFilterHotelsDirectory(
  normalizedHotels: NormalizedWidgetHotelDescriptor[],
  options: NormalizedOffreWidgetOptions
) {
  return buildHotelsDirectory(normalizedHotels, options);
}

export function buildHotelsInfoQueryKey(hotelIds: Array<number | string>) {
  return offreQueryKeys.hotelsInfo(hotelIds);
}

export function buildDeparturesQueryKey() {
  return offreQueryKeys.departures();
}

export function buildHotelInfoMap(hotels: B2CHotelInfo[]) {
  return buildHotelInfoById(hotels);
}

export function buildDerivedTimeframeOptions(hotelsDirectory: ReturnType<typeof buildHotelsDirectory>) {
  return buildTimeframeOptions(hotelsDirectory);
}

export function buildDerivedRegionOptions(params: {
  directories: B2CHotelsInfoResult | undefined;
  options: NormalizedOffreWidgetOptions;
}) {
  return buildRegionOptions(params);
}

export function buildDerivedDepartureOptions(locations: B2CLocation[]) {
  return buildDepartureOptions(locations);
}

export function buildDepartureLocationMap(locations: B2CLocation[]) {
  return getDepartureLocationsById(locations);
}

export function resolveRegionSelectionFallback(
  regions: ReturnType<typeof buildRegionOptions>,
  options: NormalizedOffreWidgetOptions
) {
  return resolvePreferredRegionId(
    regions,
    options.wildcardOption,
    options.preferRegion
  );
}

export function resolveDepartureSelectionFallback(
  departures: ReturnType<typeof buildDepartureOptions>,
  options: NormalizedOffreWidgetOptions
) {
  return resolvePreferredDepartureId(
    departures,
    options.departureCity
  );
}

export function resolveSelectedDeparture(
  departureLocationsById: Map<string, B2CLocation>,
  selectedDepartureId: string
) {
  return departureLocationsById.get(selectedDepartureId) ?? null;
}

export function buildMatchedHotelsDirectory(params: {
  hotelsDirectory: ReturnType<typeof buildHotelsDirectory>;
  hotelInfoById: Map<string, B2CHotelInfo>;
  selectedTimeframe: string;
  selectedRegionId: string;
  groupBy: NormalizedOffreWidgetOptions["groupBy"];
}) {
  return filterMatchedHotels(params);
}

export function buildDerivedRegionTabs(regionOptions: ReturnType<typeof buildRegionOptions>) {
  return buildRegionTabs(regionOptions);
}

export function resolveRegionsLoading(isPending: boolean) {
  return isPending;
}
