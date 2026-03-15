import { describe, expect, it } from "vitest";
import type { B2CHotelInfo } from "offre/api/types";
import {
  getWidgetHotelIds,
  normalizeWidgetHotelDescriptor,
  normalizeWidgetOptions
} from "offre/lib/payload";
import { buildOffreProductQueries } from "offre/lib/search-criterias";
import { buildHotelTimeframes } from "offre/lib/timeframes";

describe("offre data layer", () => {
  it("normalizes missing timeframe and builds safe default timeframes", () => {
    const options = normalizeWidgetOptions({
      groupBy: "areas",
      chartersOnly: true
    });
    const hotel = normalizeWidgetHotelDescriptor({ id: 3815 }, options);

    expect(hotel).not.toBeNull();
    expect(options.timeframe.fluid).toEqual(["P14D", "P115D"]);

    const timeframes = buildHotelTimeframes(hotel!, options);

    expect(timeframes.length).toBeGreaterThan(0);
    expect(timeframes.every((timeframe) => timeframe.searchFields.nights[0] === 7)).toBe(true);
  });

  it("builds package and hotel-only search criterias from runtime hotels", () => {
    const options = normalizeWidgetOptions({
      groupBy: "areas",
      chartersOnly: false,
      maxPrice: 150000,
      nights: [7, 9]
    });
    const hotelInfoById = new Map<string, B2CHotelInfo>([
      ["3815", { id: 3815, areaKey: "3", location: { id: "3815-7-1-", type: 7, name: "Hotel 1" } }],
      ["49757", { id: 49757, areaKey: "3", location: { id: "49757-7-1-", type: 7, name: "Hotel 2" } }]
    ]);

    const queries = buildOffreProductQueries({
      hotels: [
        {
          id: 3815,
          onlyhotel: false,
          usps: [],
          timeframes: [{
            key: "июнь",
            searchFields: {
              beginDates: ["2026-06-01", "2026-06-30"],
              nights: [7, 9]
            }
          }]
        },
        {
          id: 49757,
          onlyhotel: true,
          usps: [],
          timeframes: [{
            key: "июнь",
            searchFields: {
              beginDates: ["2026-06-01", "2026-06-30"],
              nights: [7, 9]
            }
          }]
        }
      ],
      hotelInfoById,
      selectedTimeframe: "июнь",
      selectedDeparture: {
        id: "2671-5--",
        type: 5,
        name: "Москва",
        friendlyUrl: "moskva"
      },
      options
    });

    expect(queries).toHaveLength(2);
    expect(queries[0]?.searchCriterias.additionalFilters).toHaveLength(1);
    expect("departureLocations" in queries[0]!.searchCriterias || "departureLocations" in queries[1]!.searchCriterias).toBe(true);
    expect(queries.some((query) => query.onlyhotel)).toBe(true);
  });

  it("deduplicates hotel ids and arrival locations while preserving first-seen order", () => {
    expect(getWidgetHotelIds([805, 29304, 805, 734, 30730, 734])).toEqual([
      805,
      29304,
      734,
      30730
    ]);

    const options = normalizeWidgetOptions({
      groupBy: "areas",
      chartersOnly: false,
      nights: [7]
    });
    const hotelInfoById = new Map<string, B2CHotelInfo>([
      ["805", { id: 805, areaKey: "3", location: { id: "805-7-1-", type: 7, name: "Hotel 805" } }]
    ]);

    const queries = buildOffreProductQueries({
      hotels: [
        {
          id: 805,
          onlyhotel: false,
          usps: [],
          timeframes: [{
            key: "июнь",
            searchFields: {
              beginDates: ["2026-06-01", "2026-06-30"],
              nights: [7]
            }
          }]
        },
        {
          id: 805,
          onlyhotel: false,
          usps: [],
          timeframes: [{
            key: "июнь",
            searchFields: {
              beginDates: ["2026-06-01", "2026-06-30"],
              nights: [7]
            }
          }]
        }
      ],
      hotelInfoById,
      selectedTimeframe: "июнь",
      selectedDeparture: {
        id: "2671-5--",
        type: 5,
        name: "Москва",
        friendlyUrl: "moskva"
      },
      options
    });

    expect(queries).toHaveLength(1);
    expect(queries[0]?.searchCriterias.arrivalLocations).toEqual([
      { id: "805-7-1-", type: 7 }
    ]);
    expect(queries[0]?.searchCriterias.paging.pageSize).toBe(1);
  });
});
