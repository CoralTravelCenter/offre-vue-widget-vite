import { describe, expect, it } from "vitest";
import {
  normalizeRuntimeWidgetPayload,
  normalizeWidgetHotels,
  normalizeWidgetOptions
} from "offre/lib/payload";

describe("normalizeWidgetHotels", () => {
  it("drops per-hotel room criterias and keeps shared options room criterias", () => {
    const options = normalizeWidgetOptions({
      roomCriterias: [{
        passengers: [
          { passengerType: 0, age: 20 },
          { passengerType: 1, age: 7 }
        ]
      }]
    });

    const hotels = normalizeWidgetHotels([{
      id: 101,
      onlyhotel: true,
      usps: ["reef"],
      roomCriterias: [{
        passengers: [
          { passengerType: 0, age: 33 }
        ]
      }]
    }], options);

    expect(options.roomCriterias).toEqual([{
      passengers: [
        { passengerType: 0, age: 20 },
        { passengerType: 1, age: 7 }
      ]
    }]);
    expect(hotels).toHaveLength(1);
    expect(hotels[0]).not.toHaveProperty("roomCriterias");
    expect(hotels[0]).toMatchObject({
      id: 101,
      onlyhotel: true,
      usps: ["reef"]
    });
  });
});

describe("normalizeRuntimeWidgetPayload", () => {
  it("builds a normalized runtime payload once at the application boundary", () => {
    const payload = normalizeRuntimeWidgetPayload({
      brand: "coral",
      options: {
        groupBy: "regions",
        nights: [10, "7" as never, 0],
        chartersOnly: 1 as never
      },
      hotels: [
        101,
        {
          id: "202",
          onlyhotel: 1 as never,
          usps: ["reef", 42 as never]
        }
      ]
    });

    expect(payload).toMatchObject({
      brand: "coral",
      options: {
        groupBy: "regions",
        chartersOnly: true,
        nights: [7, 10]
      },
      hotels: [
        {
          id: 101,
          onlyhotel: false,
          usps: []
        },
        {
          id: "202",
          onlyhotel: true,
          usps: ["reef"]
        }
      ]
    });
  });
});
