// @vitest-environment jsdom

import { createApp, h, nextTick, ref } from "vue";
import { afterEach, describe, expect, it } from "vitest";
import { useOffreWidgetUiState } from "@/offre/composables/useOffreWidgetUiState";
import type { NormalizedOffreWidgetOptions } from "@/offre/lib/payload";

function createOptions(): NormalizedOffreWidgetOptions {
  return {
    groupBy: "regions",
    chartersOnly: false,
    pricing: "default",
    theme: "default",
    timeframe: { fluid: ["P14D", "P115D"], monthly: true },
    nights: [7],
    regionsOrder: [],
    sortBy: "price",
    roomCriterias: [{
      passengers: [
        { age: 20, passengerType: 0 },
        { age: 20, passengerType: 0 }
      ]
    }]
  };
}

describe("useOffreWidgetUiState", () => {
  const mountedHosts: HTMLElement[] = [];

  afterEach(() => {
    for (const host of mountedHosts) {
      host.remove();
    }

    mountedHosts.length = 0;
    window.sessionStorage.clear();
  });

  it("resets selected guests back to the default widget room criteria", async () => {
    const options = ref(createOptions());
    let state!: ReturnType<typeof useOffreWidgetUiState>;

    const app = createApp({
      setup() {
        state = useOffreWidgetUiState({
          optionsSource: options,
          storageKeySource: ref("widget-guests-test")
        });

        return () => h("div");
      }
    });

    const host = document.createElement("div");
    document.body.appendChild(host);
    mountedHosts.push(host);
    app.mount(host);

    state.handleGuestsApply({
      adultsCount: 3,
      childrenAges: [5, 9]
    });
    await nextTick();

    expect(state.selectedGuests.value).toEqual({
      adultsCount: 3,
      childrenAges: [5, 9]
    });
    expect(state.guestsFilterKey.value).toBe(JSON.stringify({
      adultsCount: 3,
      childrenAges: [5, 9]
    }));

    state.handleGuestsReset();
    await nextTick();

    expect(state.selectedGuests.value).toEqual({
      adultsCount: 2,
      childrenAges: []
    });
    expect(state.guestsFilterKey.value).toBe(JSON.stringify({
      adultsCount: 2,
      childrenAges: []
    }));

    app.unmount();
  });
});
