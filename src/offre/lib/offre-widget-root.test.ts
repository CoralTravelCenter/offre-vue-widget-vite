import { describe, expect, it } from "vitest";
import {
  buildMapViewKey,
  buildWidgetPersistenceKey,
  shouldActivateMapView
} from "@/offre/lib/offre-widget-root";

describe("offre-widget-root helpers", () => {
  it("builds stable persistence keys with optional mode", () => {
    expect(buildWidgetPersistenceKey({
      brandKey: "coral",
      hotelIds: [10, 20],
      options: { sortBy: "price" }
    })).toBe(
      buildWidgetPersistenceKey({
        brandKey: "coral",
        hotelIds: [10, 20],
        options: { sortBy: "price" }
      })
    );

    expect(buildWidgetPersistenceKey({
      brandKey: "coral",
      hotelIds: [10, 20],
      options: { sortBy: "price" },
      mode: "results-view"
    })).not.toBe(buildWidgetPersistenceKey({
      brandKey: "coral",
      hotelIds: [10, 20],
      options: { sortBy: "price" }
    }));
  });

  it("builds map view key from selected filters", () => {
    expect(buildMapViewKey({
      activeRegionId: "hurghada",
      selectedDepartureId: "msk",
      selectedTimeframe: "may",
      guestsFilterKey: "{\"adultsCount\":2}"
    })).toBe("hurghada|msk|may|{\"adultsCount\":2}");
  });

  it("activates map view only for map mode", () => {
    expect(shouldActivateMapView("map")).toBe(true);
    expect(shouldActivateMapView("list")).toBe(false);
  });
});
