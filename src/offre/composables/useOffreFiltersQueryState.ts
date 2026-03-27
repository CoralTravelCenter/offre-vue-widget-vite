import { useQuery } from "@tanstack/vue-query";
import {
  computed,
  ref,
  toValue,
  watch,
  type MaybeRefOrGetter
} from "vue";
import { listDepartureLocations, listHotelsInfo } from "offre/api/client";
import type { B2CHotelInfo, B2CLocationDirectory } from "offre/api/types";
import { buildHotelTimeframes } from "offre/lib/timeframes";
import {
  cleanOffreRegionLabel,
  normalizeOffreRegionLabelForCompare
} from "offre/lib/region-labels";
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
import { getCityCorrectName } from "app/plugins/city-spelling";
import type { WidgetHotelEntry, WidgetOptions } from "shared/types/widget";

const WILDCARD_REGION_ID = "*";
type HotelLocationField = "countryKey" | "regionKey" | "areaKey" | "placeKey";

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

function resolvePreferredDepartureId(departures: OffreDepartureOption[], requestedDepartureCity: string | undefined) {
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

function resolvePreferredRegionId(
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

export function useOffreFiltersQueryState(
  optionsSource: MaybeRefOrGetter<WidgetOptions | undefined>,
  hotelsListSource: MaybeRefOrGetter<WidgetHotelEntry[] | undefined>
) {
  const options = computed(() => normalizeWidgetOptions(toValue(optionsSource)));
  const normalizedHotels = computed(() => normalizeWidgetHotels(toValue(hotelsListSource), options.value));
  const hotelIds = computed(() => getWidgetHotelIds(toValue(hotelsListSource)));
  const hotelsDirectory = computed<OffreHotelRuntimeEntry[]>(() => {
    return normalizedHotels.value.map((hotel) => ({
      id: hotel.id,
      onlyhotel: hotel.onlyhotel,
      usps: hotel.usps,
      timeframes: buildHotelTimeframes(hotel, options.value)
    }));
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
    const lookup = new Map<string, B2CHotelInfo>();

    for (const hotelInfo of hotelsInfoQuery.data.value?.hotels ?? []) {
      lookup.set(String(hotelInfo.id), hotelInfo);
    }

    return lookup;
  });

  const timeframeOptions = computed(() => {
    const uniqueTimeframes = new Set<string>();

    for (const hotel of hotelsDirectory.value) {
      for (const timeframe of hotel.timeframes) {
        uniqueTimeframes.add(timeframe.key);
      }
    }

    return Array.from(uniqueTimeframes).map((value) => ({
      value,
      label: value
    }));
  });

  const regionOptions = computed<OffreRegionOption[]>(() => {
    const directory = resolveRegionDirectory(hotelsInfoQuery.data.value, options.value.groupBy);
    const normalizedRegionsOrder = options.value.regionsOrder.map((entry) => {
      return normalizeOffreRegionLabelForCompare(entry);
    });
    const regions = Object.entries(directory).map(([id, location]) => ({
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

    if (typeof options.value.wildcardOption === "string" && options.value.wildcardOption.trim()) {
      return [{
        id: WILDCARD_REGION_ID,
        label: options.value.wildcardOption,
        wildcard: true
      }, ...regions];
    }

    return regions;
  });

  const departures = computed<OffreDepartureOption[]>(() => {
    return (departuresQuery.data.value?.locations ?? []).map((location) => ({
      id: location.id,
      type: location.type,
      label: formatDepartureLabel(location.name),
      friendlyUrl: location.friendlyUrl,
      isCurrent: location.isCurrent
    }));
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
    if (!selectedTimeframe.value || hotelInfoById.value.size === 0) {
      return [] as OffreHotelRuntimeEntry[];
    }

    const locationFieldByGroup: Record<typeof options.value.groupBy, HotelLocationField> = {
      countries: "countryKey",
      regions: "regionKey",
      areas: "areaKey",
      places: "placeKey"
    };
    const locationField = locationFieldByGroup[options.value.groupBy];

    return hotelsDirectory.value.filter((hotel) => {
      const hotelInfo = hotelInfoById.value.get(String(hotel.id));

      if (!hotelInfo) {
        return false;
      }

      const hasTimeframe = hotel.timeframes.some((timeframe) => timeframe.key === selectedTimeframe.value);

      if (!hasTimeframe) {
        return false;
      }

      if (selectedRegionId.value === WILDCARD_REGION_ID) {
        return true;
      }

      return String(hotelInfo[locationField] ?? "") === selectedRegionId.value;
    });
  });

  const regionTabs = computed<RegionTabItem[]>(() => {
    return regionOptions.value.map((region) => ({
      id: region.id,
      label: region.label
    }));
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
