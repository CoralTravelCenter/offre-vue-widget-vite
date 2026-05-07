import { describe, expect, it } from "vitest";
import { normalizeWidgetHotels, normalizeWidgetOptions } from "offre/lib/payload";

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
