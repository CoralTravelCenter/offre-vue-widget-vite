import { describe, expect, it } from "vitest";
import {
  normalizeNights,
  normalizeTimeframe,
  normalizeWidgetOptions
} from "@/offre/lib/payload-options";

describe("payload-options", () => {
  it("normalizes fixed timeframe presets and preserves monthly flag", () => {
    expect(normalizeTimeframe({
      fixed: [
        { key: "jun", frame: ["2026-06-01", "2026-06-30"] }
      ],
      monthly: true
    })).toEqual({
      fixed: [
        { key: "jun", frame: ["2026-06-01", "2026-06-30"] }
      ],
      monthly: true
    });
  });

  it("falls back to default timeframe for invalid values", () => {
    expect(normalizeTimeframe({ fixed: [1, 2, 3] })).toEqual({
      fluid: ["P14D", "P115D"],
      monthly: true
    });
  });

  it("normalizes nights and filters invalid entries", () => {
    expect(normalizeNights([10, "7", 0, -1, "bad"])).toEqual([7, 10]);
    expect(normalizeNights(undefined, [5])).toEqual([5]);
  });

  it("normalizes widget options to supported enum values and sanitizes arrays", () => {
    expect(normalizeWidgetOptions({
      groupBy: "bad" as never,
      pricing: "weird" as never,
      sortBy: "oops" as never,
      theme: "night" as never,
      chartersOnly: 1 as never,
      regionsOrder: ["a", 2 as never, "b"],
      roomCriterias: [{
        passengers: [
          { passengerType: 0, age: 20 },
          { passengerType: 1, age: 8 }
        ]
      }]
    })).toMatchObject({
      groupBy: "countries",
      pricing: "default",
      sortBy: "price",
      theme: "default",
      chartersOnly: true,
      regionsOrder: ["a", "b"],
      roomCriterias: [{
        passengers: [
          { passengerType: 0, age: 20 },
          { passengerType: 1, age: 8 }
        ]
      }]
    });
  });
});
