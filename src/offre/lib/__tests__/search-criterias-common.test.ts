import { describe, expect, it } from "vitest";
import {
  HOTEL_COMMON_SEARCH_CRITERIAS,
  PACKAGE_COMMON_SEARCH_CRITERIAS,
  resolveRoomCriterias
} from "@/offre/lib/search-criterias-common";
import { normalizeWidgetOptions } from "@/offre/lib/payload-options";

describe("search-criterias-common", () => {
  it("uses widget room criterias when they are provided", () => {
    const options = normalizeWidgetOptions({
      roomCriterias: [{
        passengers: [
          { passengerType: 0, age: 20 },
          { passengerType: 1, age: 9 }
        ]
      }]
    });

    expect(resolveRoomCriterias(options, HOTEL_COMMON_SEARCH_CRITERIAS.roomCriterias)).toEqual([{
      passengers: [
        { passengerType: 0, age: 20 },
        { passengerType: 1, age: 9 }
      ]
    }]);
  });

  it("falls back to default room criterias when widget options do not define them", () => {
    const options = normalizeWidgetOptions({});

    expect(resolveRoomCriterias(options, PACKAGE_COMMON_SEARCH_CRITERIAS.roomCriterias)).toEqual(
      PACKAGE_COMMON_SEARCH_CRITERIAS.roomCriterias
    );
  });
});
