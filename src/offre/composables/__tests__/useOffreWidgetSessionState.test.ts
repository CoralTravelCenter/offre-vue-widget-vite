import { computed, nextTick, ref } from "vue";
import { describe, expect, it } from "vitest";
import { useOffreWidgetSessionState } from "@/offre/composables/useOffreWidgetSessionState";
import { normalizeWidgetOptions } from "@/offre/lib/payload";

describe("useOffreWidgetSessionState", () => {
  it("recomputes persistence keys and bumps reset nonce when product session inputs change", async () => {
    const brandKey = ref("coral");
    const hotelIds = ref<Array<number | string>>([101, 202]);
    const options = ref(normalizeWidgetOptions({ groupBy: "regions" }));
    const selectedDepartureId = ref("msk");
    const selectedTimeframe = ref("jun");
    const guestsFilterKey = ref('{"adultsCount":2,"childrenAges":[]}');

    const state = useOffreWidgetSessionState({
      brandKeySource: brandKey,
      hotelIdsSource: hotelIds,
      optionsSource: options,
      effectiveSearchOptionsSource: computed(() => ({
        ...options.value,
        roomCriterias: [{
          passengers: [
            { age: 20, passengerType: 0 },
            { age: 20, passengerType: 0 }
          ]
        }]
      })),
      selectedDepartureIdSource: selectedDepartureId,
      selectedTimeframeSource: selectedTimeframe,
      guestsFilterKeySource: guestsFilterKey
    });

    const initialProductsSessionKey = state.productsSessionKey.value;
    const initialResetNonce = state.resetNonce.value;

    selectedTimeframe.value = "jul";
    await nextTick();

    expect(state.productsSessionKey.value).not.toBe(initialProductsSessionKey);
    expect(state.resetNonce.value).toBe(initialResetNonce + 1);
    expect(state.guestsPersistenceKey.value).toContain('"brandKey":"coral"');
    expect(state.viewModePersistenceKey.value).toContain('"mode":"results-view"');
  });
});
