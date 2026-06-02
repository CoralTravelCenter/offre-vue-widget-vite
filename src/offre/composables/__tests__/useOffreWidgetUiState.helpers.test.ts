import { describe, expect, it } from "vitest";
import {
  buildSelectedRoomCriterias,
  isPersistedGuestsState,
  normalizeGuestsState,
  resolveGuestsStorageKey,
  resolveInitialGuestsState
} from "@/offre/composables/useOffreWidgetUiState.helpers";

describe("useOffreWidgetUiState helpers", () => {
  it("normalizes guest counts and child ages within allowed bounds", () => {
    expect(normalizeGuestsState({
      adultsCount: 10,
      childrenAges: [-1, 4, 22, 8, 10]
    })).toEqual({
      adultsCount: 6,
      childrenAges: [0, 4, 18, 8]
    });
  });

  it("validates persisted guests payloads and storage keys", () => {
    expect(isPersistedGuestsState({
      adultsCount: 2,
      childrenAges: [7, 10]
    })).toBe(true);
    expect(isPersistedGuestsState({
      adultsCount: 0,
      childrenAges: []
    })).toBe(false);
    expect(resolveGuestsStorageKey(" widget-1 ")).toBe("offre-widget:guests:widget-1");
  });

  it("derives initial state and room criterias from passengers", () => {
    const initialGuests = resolveInitialGuestsState([{
      passengers: [
        { passengerType: 0, age: 20 },
        { passengerType: 1, age: 7 }
      ]
    }]);

    expect(initialGuests).toEqual({
      adultsCount: 1,
      childrenAges: [7]
    });
    expect(buildSelectedRoomCriterias(initialGuests)).toEqual([{
      passengers: [
        { age: 20, passengerType: 0 },
        { age: 7, passengerType: 1 }
      ]
    }]);
  });
});
