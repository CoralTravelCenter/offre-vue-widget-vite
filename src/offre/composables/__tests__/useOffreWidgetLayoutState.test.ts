import { ref } from "vue";
import { describe, expect, it, vi } from "vitest";
import { useOffreWidgetLayoutState } from "@/offre/composables/useOffreWidgetLayoutState";

vi.mock("@vueuse/core", () => ({
  useMediaQuery: vi.fn((query: string) => {
    return ref(query === "(min-width: 1024px)");
  })
}));

describe("useOffreWidgetLayoutState", () => {
  it("builds map view key and keeps map mode activated immediately", () => {
    const viewMode = ref<"list" | "map">("list");
    const activeRegionId = ref("hurghada");
    const selectedDepartureId = ref("msk");
    const selectedTimeframe = ref("may");

    const state = useOffreWidgetLayoutState({
      viewModeRef: viewMode,
      activeRegionIdSource: activeRegionId,
      selectedDepartureIdSource: selectedDepartureId,
      selectedTimeframeSource: selectedTimeframe
    });

    expect(state.hasActivatedMapView.value).toBe(true);
    expect(state.mapViewKey.value).toBe("hurghada|msk|may");
    expect(state.navigationFixedOptions.value.top).toBe(16);
  });

  it("updates floating state through the fixed callback", () => {
    const state = useOffreWidgetLayoutState({
      viewModeRef: ref<"list" | "map">("list"),
      activeRegionIdSource: ref("hurghada"),
      selectedDepartureIdSource: ref("msk"),
      selectedTimeframeSource: ref("may")
    });

    state.navigationFixedOptions.value.onStick({ fixed: true });
    expect(state.navigationFloating.value).toBe(true);
  });
});
