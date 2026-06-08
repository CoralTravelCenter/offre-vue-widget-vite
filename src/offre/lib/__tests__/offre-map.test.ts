import { describe, expect, it } from "vitest";
import {
  buildBaseMapPoints,
  buildHotelIdSet,
  buildMapPointsLocationKey,
  buildMapSearchPoints,
  buildPointsByHotelId
} from "@/offre/lib/offre-map";

describe("offre-map helpers", () => {
  it("builds base map points only for hotels with coordinates", () => {
    const points = buildBaseMapPoints([
      {
        hotel: {
          id: 10,
          name: "Hotel Alpha",
          locationSummary: "Hurghada",
          coordinates: { latitude: "27.2", longitude: "33.8" }
        },
        offers: []
      },
      {
        hotel: {
          id: 11,
          name: "Hotel Beta"
        },
        offers: []
      }
    ]);

    expect(points).toHaveLength(1);
    expect(points[0]).toMatchObject({
      hotelId: "10",
      hotelName: "Hotel Alpha",
      locationLabel: "Hurghada"
    });
  });

  it("enriches map points with effective offer and lookup helpers", () => {
    const basePoints = buildBaseMapPoints([{
      hotel: {
        id: 10,
        name: "Hotel Alpha",
        locationSummary: "Hurghada",
        coordinates: { latitude: "27.2", longitude: "33.8" }
      },
      offers: [{
        price: { amount: 120000 },
        stayNights: 6,
        rooms: [{ passengers: [{ passengerType: 0, age: 20 }, { passengerType: 0, age: 20 }] }]
      }]
    }]);

    const points = buildMapSearchPoints({
      points: basePoints,
      hotelOffersByHotelId: new Map(),
      loadingHotelIds: new Set(),
      mapOfferMode: "package",
      pricingMode: "default",
      hostname: "example.com"
    });

    expect(points[0]).toMatchObject({
      hotelId: "10",
      currentPriceValue: 120000
    });
    expect(points[0]?.currentPriceLabel).toContain("120");
    expect(points[0]?.currentPriceLabel).toContain("₽");
    expect(buildPointsByHotelId(points).get("10")).toBe(points[0]);
    expect(buildHotelIdSet(points).has("10")).toBe(true);
  });

  it("builds a stable location key regardless of point order", () => {
    const left = buildMapPointsLocationKey([
      { hotelId: "202", longitude: 33.8, latitude: 27.2 },
      { hotelId: "101", longitude: 28.8, latitude: 36.9 }
    ]);

    const right = buildMapPointsLocationKey([
      { hotelId: "101", longitude: 28.8, latitude: 36.9 },
      { hotelId: "202", longitude: 33.8, latitude: 27.2 }
    ]);

    expect(left).toBe(right);
  });
});
