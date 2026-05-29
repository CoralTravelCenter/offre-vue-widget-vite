import { describe, expect, it } from "vitest";
import {
  normalizeRuntimeWidgetPayload,
  normalizeWidgetHotelDescriptor
} from "@/offre/lib/payload-hotels";
import { normalizeWidgetOptions } from "@/offre/lib/payload-options";

describe("payload-hotels", () => {
  it("normalizes hotel descriptor fields and strips per-hotel room criterias", () => {
    const options = normalizeWidgetOptions({
      nights: [7]
    });

    const descriptor = normalizeWidgetHotelDescriptor({
      id: "202",
      onlyhotel: 1 as never,
      timeframe: {
        fluid: ["P10D", "P20D"],
        monthly: false
      },
      nights: [10, "7" as never],
      usps: ["reef", 42 as never],
      roomCriterias: [{
        passengers: [{ passengerType: 0, age: 30 }]
      }]
    }, options);

    expect(descriptor).toMatchObject({
      id: "202",
      onlyhotel: true,
      timeframe: {
        fluid: ["P10D", "P20D"],
        monthly: false
      },
      nights: [7, 10],
      usps: ["reef"]
    });
    expect(descriptor).not.toHaveProperty("roomCriterias");
  });

  it("builds normalized runtime payload with sanitized brand and hotel list", () => {
    expect(normalizeRuntimeWidgetPayload({
      brand: " coral ",
      options: {
        groupBy: "regions"
      },
      hotels: [
        "",
        101,
        { id: "202", onlyhotel: true }
      ] as never
    })).toMatchObject({
      brand: "coral",
      options: {
        groupBy: "regions"
      },
      hotels: [
        { id: 101, onlyhotel: false, usps: [] },
        { id: "202", onlyhotel: true, usps: [] }
      ]
    });
  });
});
