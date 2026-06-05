import { useMediaQuery } from "@vueuse/core";
import { computed, ref, type Ref } from "vue";
import { buildMapViewKey } from "@/offre/lib/offre-widget-root";
import type { OffreViewMode } from "@/offre/types";

const DESKTOP_LAYOUT_BREAKPOINT = "(min-width: 1024px)";
const TABLET_LAYOUT_BREAKPOINT = "(min-width: 768px)";
const CONTROLS_FIXED_Z_INDEX = 30;
const MV_MODE_TOP_OFFSET = 76;
const DESKTOP_TOP_OFFSET = 16;
const TABLET_TOP_OFFSET = 57;
const MOBILE_TOP_OFFSET = 74;

function resolveIsMvMode() {
  if (typeof window === "undefined") {
    return false;
  }

  return new URLSearchParams(window.location.search).get("mv") === "true";
}

export function useOffreWidgetLayoutState(params: {
  viewModeRef: Ref<OffreViewMode>;
  activeRegionIdSource: Ref<string>;
  selectedDepartureIdSource: Ref<string>;
  selectedTimeframeSource: Ref<string>;
}) {
  const isMvMode = computed(resolveIsMvMode);
  const isLargeScreen = useMediaQuery(DESKTOP_LAYOUT_BREAKPOINT);
  const isTabletScreen = useMediaQuery(TABLET_LAYOUT_BREAKPOINT);
  const navigationFloating = ref(false);
  const hasActivatedMapView = ref(true);

  function resolveNavigationTopOffset() {
    if (isMvMode.value) {
      return MV_MODE_TOP_OFFSET;
    }

    if (isLargeScreen.value) {
      return DESKTOP_TOP_OFFSET;
    }

    if (isTabletScreen.value) {
      return TABLET_TOP_OFFSET;
    }

    return MOBILE_TOP_OFFSET;
  }

  const navigationFixedOptions = computed(() => ({
    top: resolveNavigationTopOffset(),
    zIndex: CONTROLS_FIXED_Z_INDEX,
    onStick: (fixedState: { fixed: boolean }) => {
      navigationFloating.value = fixedState.fixed;
    }
  }));

  const mapViewKey = computed(() => {
    return buildMapViewKey({
      activeRegionId: params.activeRegionIdSource.value,
      selectedDepartureId: params.selectedDepartureIdSource.value,
      selectedTimeframe: params.selectedTimeframeSource.value
    });
  });

  return {
    navigationFixedOptions,
    navigationFloating,
    hasActivatedMapView,
    mapViewKey
  };
}
