import { useQuery } from "@tanstack/vue-query";
import {
  computed,
  toValue,
  type MaybeRefOrGetter
} from "vue";
import { listDepartureLocations, listHotelsInfo } from "@/offre/api";
import type {
  B2CHotelInfo,
  B2CHotelsInfoResult,
  B2CListDepartureLocationsResult,
  B2CLocation
} from "@/offre/api";
import { useResolvedSelection } from "@/offre/composables/useResolvedSelection";
import {
  buildDepartureOptions,
  buildHotelsDirectory,
  buildHotelInfoById,
  buildRegionOptions,
  buildRegionTabs,
  buildTimeframeOptions,
  filterMatchedHotels,
  getDepartureLocationsById,
  resolvePreferredDepartureId,
  resolvePreferredRegionId
} from "@/offre/lib/filter-state";
import {
  getWidgetHotelIds,
  type NormalizedOffreWidgetOptions,
  type NormalizedWidgetHotelDescriptor
} from "@/offre/lib/payload";
import { offreQueryConfig, offreQueryKeys, offreQueryPersisters } from "@/offre/query";
import type {
  OffreDepartureOption,
  OffreHotelRuntimeEntry,
  OffreRegionOption,
  RegionTabItem
} from "@/offre/types";
export function useOffreFiltersQueryState(
  optionsSource: MaybeRefOrGetter<NormalizedOffreWidgetOptions>,
  hotelsListSource: MaybeRefOrGetter<NormalizedWidgetHotelDescriptor[]>
) {
  const options = computed(() => toValue(optionsSource));
  const normalizedHotels = computed(() => toValue(hotelsListSource));
  const hotelIds = computed(() => getWidgetHotelIds(normalizedHotels.value));
  const hotelsDirectory = computed<OffreHotelRuntimeEntry[]>(() => {
    return buildHotelsDirectory(normalizedHotels.value, options.value);
  });
  const hotelInfoQueryKey = computed(() => offreQueryKeys.hotelsInfo(hotelIds.value));
  const departureQueryKey = computed(() => offreQueryKeys.departures());

  const hotelsInfoQuery = useQuery<B2CHotelsInfoResult>({
    queryKey: hotelInfoQueryKey,
    enabled: computed(() => hotelIds.value.length > 0),
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
    staleTime: offreQueryConfig.departures.staleTime,
    gcTime: offreQueryConfig.departures.gcTime,
    persister: offreQueryPersisters.departures.persisterFn,
    queryFn: async ({ signal }) => {
      const response = await listDepartureLocations({ signal });
      return response.result;
    }
  });

  const hotelInfoById = computed(() => {
    return buildHotelInfoById(hotelsInfoQuery.data.value?.hotels ?? []);
  });

  const timeframeOptions = computed(() => {
    return buildTimeframeOptions(hotelsDirectory.value);
  });

  const regionOptions = computed<OffreRegionOption[]>(() => {
    return buildRegionOptions({
      directories: hotelsInfoQuery.data.value,
      options: options.value
    });
  });

  const departures = computed<OffreDepartureOption[]>(() => {
    return buildDepartureOptions(departuresQuery.data.value?.locations ?? []);
  });
  const departureLocationsById = computed(() => {
    return getDepartureLocationsById(departuresQuery.data.value?.locations ?? []);
  });
  const {
    selectedValue: selectedRegionId,
    setSelectedValue: setActiveRegion
  } = useResolvedSelection({
    itemsSource: regionOptions,
    getValue: (region) => region.id,
    getFallbackValue: (regions) => resolvePreferredRegionId(
      regions,
      options.value.wildcardOption,
      options.value.preferRegion
    )
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
    getFallbackValue: (departureOptions) => resolvePreferredDepartureId(
      departureOptions,
      options.value.departureCity
    )
  });

  const selectedDeparture = computed(() => {
    return departureLocationsById.value.get(selectedDepartureId.value) ?? null;
  });

  const matchedHotelsDirectory = computed(() => {
    return filterMatchedHotels({
      hotelsDirectory: hotelsDirectory.value,
      hotelInfoById: hotelInfoById.value,
      selectedTimeframe: selectedTimeframe.value,
      selectedRegionId: selectedRegionId.value,
      groupBy: options.value.groupBy
    });
  });

  const regionTabs = computed<RegionTabItem[]>(() => {
    return buildRegionTabs(regionOptions.value);
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
    regionsLoading: computed(() => hotelsInfoQuery.isPending.value)
  };
}
