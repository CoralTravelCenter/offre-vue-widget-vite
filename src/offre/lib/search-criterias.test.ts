import { describe, expect, it } from "vitest";
import { buildOffreProductQueries } from "@/offre/lib/search-criterias";

describe("buildOffreProductQueries", () => {
  it("keeps one batched query and uses hotel count as page size for shared arrival locations", () => {
    const descriptors = buildOffreProductQueries({
      hotels: [
        {
          id: "101",
          onlyhotel: false,
          usps: [],
          timeframes: [{
            key: "June",
            searchFields: {
              beginDates: ["2026-06-01", "2026-06-30"],
              nights: [7]
            }
          }]
        },
        {
          id: "202",
          onlyhotel: false,
          usps: [],
          timeframes: [{
            key: "June",
            searchFields: {
              beginDates: ["2026-06-01", "2026-06-30"],
              nights: [7]
            }
          }]
        }
      ],
      hotelInfoById: new Map([
        ["101", {
          id: "101",
          location: {
            id: "shared-location",
            type: 7,
            name: "Shared Atoll"
          }
        }],
        ["202", {
          id: "202",
          location: {
            id: "shared-location",
            type: 7,
            name: "Shared Atoll"
          }
        }]
      ]),
      selectedTimeframe: "June",
      selectedDeparture: {
        id: "2671-5",
        type: 5,
        name: "Москва",
        friendlyUrl: "moskva"
      },
      options: {
        groupBy: "countries",
        chartersOnly: false,
        pricing: "default",
        theme: "default",
        timeframe: { fluid: ["P14D", "P115D"], monthly: true },
        nights: [7],
        regionsOrder: [],
        sortBy: "price"
      }
    });

    expect(descriptors).toHaveLength(1);
    expect(descriptors[0]).toMatchObject({
      hotels: [
        {
          hotelId: "101",
          arrivalLocation: { id: "shared-location", type: 7 }
        },
        {
          hotelId: "202",
          arrivalLocation: { id: "shared-location", type: 7 }
        }
      ],
      searchCriterias: {
        arrivalLocations: [{ id: "shared-location", type: 7 }],
        paging: {
          pageSize: 2
        }
      }
    });
  });
});
