import { useQuery } from "@tanstack/vue-query";
import {
  computed,
  toValue,
  type MaybeRefOrGetter
} from "vue";
import { listDepartureLocations, listHotelsInfo } from "@/offre/api";
import type {
  B2CHotelsInfoResult,
  B2CListDepartureLocationsResult
} from "@/offre/api";
import { useResolvedSelection } from "@/offre/composables/useResolvedSelection";
import {
  type NormalizedOffreWidgetOptions,
  type NormalizedWidgetHotelDescriptor
} from "@/offre/lib/payload";
import { offreQueryConfig, offreQueryPersisters } from "@/offre/query";
import type {
  OffreDepartureOption,
  OffreHotelRuntimeEntry,
  OffreRegionOption,
  RegionTabItem
} from "@/offre/types";
import {
  buildDepartureLocationMap,
  buildDeparturesQueryKey,
  buildDerivedDepartureOptions,
  buildDerivedRegionOptions,
  buildDerivedRegionTabs,
  buildDerivedTimeframeOptions,
  buildFilterHotelsDirectory,
  buildHotelInfoMap,
  buildHotelsInfoQueryKey,
  buildMatchedHotelsDirectory,
  resolveDepartureSelectionFallback,
  resolveHotelIds,
  resolveRegionsLoading,
  resolveRegionSelectionFallback,
  resolveSelectedDeparture
} from "@/offre/composables/useOffreFiltersQueryState.helpers";
export function useOffreFiltersQueryState(
  optionsSource: MaybeRefOrGetter<NormalizedOffreWidgetOptions>,
  hotelsListSource: MaybeRefOrGetter<NormalizedWidgetHotelDescriptor[]>,
  enabledSource: MaybeRefOrGetter<boolean> = true
) {
  const options = computed(() => toValue(optionsSource));
  const normalizedHotels = computed(() => toValue(hotelsListSource));
  const hotelIds = computed(() => resolveHotelIds(normalizedHotels.value));
  const hotelsDirectory = computed<OffreHotelRuntimeEntry[]>(() => {
    return buildFilterHotelsDirectory(normalizedHotels.value, options.value);
  });
  const hotelInfoQueryKey = computed(() => buildHotelsInfoQueryKey(hotelIds.value));
  const departureQueryKey = computed(() => buildDeparturesQueryKey());
  const queriesEnabled = computed(() => Boolean(toValue(enabledSource)));

  const hotelsInfoQuery = useQuery<B2CHotelsInfoResult>({
    queryKey: hotelInfoQueryKey,
    enabled: computed(() => queriesEnabled.value && hotelIds.value.length > 0),
    staleTime: offreQueryConfig.hotelsInfo.staleTime,
    gcTime: offreQueryConfig.hotelsInfo.gcTime,
    persister: offreQueryPersisters.hotelsInfo.persisterFn,
    queryFn: async ({ signal }) => {
      const response = await listHotelsInfo(hotelIds.value, [4, 7], { signal });
      return response.result;
    }
  });

  const departuresQuery = useQuery<B2CListDepartureLocationsResult>({
    queryKey: departureQueryKey,
    enabled: queriesEnabled,
    staleTime: offreQueryConfig.departures.staleTime,
    gcTime: offreQueryConfig.departures.gcTime,
    persister: offreQueryPersisters.departures.persisterFn,
    queryFn: async ({ signal }) => {
      const response = await listDepartureLocations({ signal });
      return response.result;
    }
  });

  const hotelInfoById = computed(() => {
    return buildHotelInfoMap(hotelsInfoQuery.data.value?.hotels ?? []);
  });

  const timeframeOptions = computed(() => {
    return buildDerivedTimeframeOptions(hotelsDirectory.value);
  });

  const regionOptions = computed<OffreRegionOption[]>(() => {
    return buildDerivedRegionOptions({
      directories: hotelsInfoQuery.data.value,
      options: options.value
    });
  });

  const departures = computed<OffreDepartureOption[]>(() => {
    return buildDerivedDepartureOptions(departuresQuery.data.value?.locations ?? []);
  });
  const departureLocationsById = computed(() => {
    return buildDepartureLocationMap(departuresQuery.data.value?.locations ?? []);
  });
  const {
    selectedValue: selectedRegionId,
    setSelectedValue: setActiveRegion
  } = useResolvedSelection({
    itemsSource: regionOptions,
    getValue: (region) => region.id,
    getFallbackValue: (regions) => resolveRegionSelectionFallback(regions, options.value)
  });
  const {
    selectedValue: selectedTimeframe,
    setSelectedValue: setSelectedTimeframe
  } = useResolvedSelection({
    itemsSource: timeframeOptions,
    getValue: (timeframe) => timeframe.value,
    getFallbackValue: (timeframes) => timeframes[0]?.value ?? ""
  });
  const {
    selectedValue: selectedDepartureId,
    setSelectedValue: setSelectedDepartureId
  } = useResolvedSelection({
    itemsSource: departures,
    getValue: (departure) => departure.id,
    getFallbackValue: (departureOptions) => resolveDepartureSelectionFallback(departureOptions, options.value)
  });

  const selectedDeparture = computed(() => {
    return resolveSelectedDeparture(departureLocationsById.value, selectedDepartureId.value);
  });

  const matchedHotelsDirectory = computed(() => {
    return buildMatchedHotelsDirectory({
      hotelsDirectory: hotelsDirectory.value,
      hotelInfoById: hotelInfoById.value,
      selectedTimeframe: selectedTimeframe.value,
      selectedRegionId: selectedRegionId.value,
      groupBy: options.value.groupBy
    });
  });

  const regionTabs = computed<RegionTabItem[]>(() => {
    return buildDerivedRegionTabs(regionOptions.value);
  });

  return {
    options,
    hotelsDirectory,
    hotelIds,
    hotelInfoById,
    hotelsInfoQuery,
    departuresQuery,
    departures,
    selectedDeparture,
    selectedDepartureId,
    setSelectedDepartureId,
    timeframeOptions,
    selectedTimeframe,
    setSelectedTimeframe,
    regionOptions,
    regionTabs,
    activeRegionId: selectedRegionId,
    setActiveRegion,
    matchedHotelsDirectory,
    regionsLoading: computed(() => resolveRegionsLoading(hotelsInfoQuery.isPending.value))
  };
}
