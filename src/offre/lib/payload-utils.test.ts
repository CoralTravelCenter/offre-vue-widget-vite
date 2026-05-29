import { describe, expect, it } from "vitest";
import {
  getWidgetHotelId,
  getWidgetHotelIds,
  isPlainObject,
  normalizeRoomCriterias
} from "@/offre/lib/payload-utils";

describe("payload-utils", () => {
  it("recognizes plain objects and rejects arrays/null", () => {
    expect(isPlainObject({ a: 1 })).toBe(true);
    expect(isPlainObject(null)).toBe(false);
    expect(isPlainObject([1, 2])).toBe(false);
  });

  it("normalizes room criterias and drops invalid passengers", () => {
    expect(normalizeRoomCriterias([{
      passengers: [
        { passengerType: 0, age: 20 },
        { passengerType: 1, age: 7 },
        { passengerType: "x", age: 10 } as never
      ]
    }])).toEqual([{
      passengers: [
        { passengerType: 0, age: 20 },
        { passengerType: 1, age: 7 }
      ]
    }]);
  });

  it("resolves hotel ids and deduplicates mixed entries", () => {
    expect(getWidgetHotelId({ id: "101" } as never)).toBe("101");
    expect(getWidgetHotelIds([
      101,
      "101",
      { id: 101 },
      { id: "202" }
    ])).toEqual([101, "101", "202"]);
  });
});
