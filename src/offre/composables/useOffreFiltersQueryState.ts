import { useQuery } from "@tanstack/vue-query";
import {
  computed,
  ref,
  toValue,
  watch,
  type MaybeRefOrGetter
} from "vue";
import { listDepartureLocations, listHotelsInfo } from "offre/api/client";
import type { B2CHotelInfo } from "offre/api/types";
import {
  buildDepartureOptions,
  buildHotelsDirectory,
  buildHotelInfoById,
  buildRegionOptions,
  buildRegionTabs,
  buildTimeframeOptions,
  filterMatchedHotels,
  resolvePreferredDepartureId,
  resolvePreferredRegionId
} from "offre/lib/filter-state";
import {
  getWidgetHotelIds,
  normalizeWidgetHotels,
  normalizeWidgetOptions
} from "offre/lib/payload";
import { offreQueryConfig } from "offre/query/config";
import { offreQueryKeys } from "offre/query/keys";
import { offreQueryPersisters } from "offre/query/persister";
import type {
  OffreDepartureOption,
  OffreHotelRuntimeEntry,
  OffreRegionOption,
  RegionTabItem
} from "offre/types";
import type { WidgetHotelEntry, WidgetOptions } from "shared/types/widget";

export function useOffreFiltersQueryState(
  optionsSource: MaybeRefOrGetter<WidgetOptions | undefined>,
  hotelsListSource: MaybeRefOrGetter<WidgetHotelEntry[] | undefined>
) {
  const options = computed(() => normalizeWidgetOptions(toValue(optionsSource)));
  const normalizedHotels = computed(() => normalizeWidgetHotels(toValue(hotelsListSource), options.value));
  const hotelIds = computed(() => getWidgetHotelIds(toValue(hotelsListSource)));
  const hotelsDirectory = computed<OffreHotelRuntimeEntry[]>(() => {
    return buildHotelsDirectory(normalizedHotels.value, options.value);
  });
  const hotelInfoQueryKey = computed(() => offreQueryKeys.hotelsInfo(hotelIds.value));
  const departureQueryKey = computed(() => offreQueryKeys.departures());

  const hotelsInfoQuery = useQuery({
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

  const departuresQuery = useQuery({
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

  const selectedRegionId = ref("");
  const selectedTimeframe = ref("");
  const selectedDepartureId = ref("");

  watch(
    regionOptions,
    (nextRegions) => {
      if (selectedRegionId.value && nextRegions.some((region) => region.id === selectedRegionId.value)) {
        return;
      }

      selectedRegionId.value = resolvePreferredRegionId(
        nextRegions,
        options.value.wildcardOption,
        options.value.preferRegion
      );
    },
    { immediate: true }
  );

  watch(
    timeframeOptions,
    (nextTimeframes) => {
      if (selectedTimeframe.value && nextTimeframes.some((timeframe) => timeframe.value === selectedTimeframe.value)) {
        return;
      }

      selectedTimeframe.value = nextTimeframes[0]?.value ?? "";
    },
    { immediate: true }
  );

  watch(
    departures,
    (nextDepartures) => {
      if (selectedDepartureId.value && nextDepartures.some((departure) => departure.id === selectedDepartureId.value)) {
        return;
      }

      selectedDepartureId.value = resolvePreferredDepartureId(nextDepartures, options.value.departureCity);
    },
    { immediate: true }
  );

  const selectedDeparture = computed(() => {
    return (departuresQuery.data.value?.locations ?? []).find((departure) => {
      return departure.id === selectedDepartureId.value;
    }) ?? null;
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

  function setActiveRegion(nextRegionId: string) {
    if (!nextRegionId) {
      return;
    }

    selectedRegionId.value = nextRegionId;
  }

  function setSelectedTimeframe(nextTimeframe: string) {
    if (!nextTimeframe) {
      return;
    }

    selectedTimeframe.value = nextTimeframe;
  }

  function setSelectedDepartureId(nextDepartureId: string) {
    if (!nextDepartureId) {
      return;
    }

    selectedDepartureId.value = nextDepartureId;
  }

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
