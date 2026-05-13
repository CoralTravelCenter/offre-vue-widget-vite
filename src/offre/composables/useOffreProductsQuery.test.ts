import { describe, expect, it } from "vitest";
import { resolveProductsRequestState } from "@/offre/lib/products-batch";
import { buildFallbackQueryDescriptors } from "@/offre/composables/useOffreProductsQuery";

describe("resolveProductsRequestState", () => {
  it("returns partial when some batched requests fail", () => {
    expect(resolveProductsRequestState(1, 3)).toBe("partial");
  });

  it("returns error when all batched requests fail", () => {
    expect(resolveProductsRequestState(3, 3)).toBe("error");
  });

  it("returns success when all batched requests succeed", () => {
    expect(resolveProductsRequestState(0, 3)).toBe("success");
  });
});

describe("buildFallbackQueryDescriptors", () => {
  it("creates single-hotel fallback requests only for missing batched hotels", () => {
    const descriptors = [{
      hotels: [
        {
          hotelId: "22404",
          arrivalLocation: { id: "22404-7", type: 7 }
        },
        {
          hotelId: "1675",
          arrivalLocation: { id: "1675-7", type: 7 }
        }
      ],
      onlyhotel: false,
      searchCriterias: {
        datePickerMode: 0,
        reservationType: 1 as const,
        imageSizes: [4, 7],
        roomCriterias: [{
          passengers: [
            { age: 20, passengerType: 0 },
            { age: 20, passengerType: 0 }
          ]
        }],
        beginDates: ["2026-06-01", "2026-06-30"] as [string, string],
        nights: [{ value: 7 }],
        departureLocations: [{
          id: "2671-5",
          type: 5,
          name: "Москва",
          friendlyUrl: "moskva"
        }],
        arrivalLocations: [
          { id: "22404-7", type: 7 },
          { id: "1675-7", type: 7 }
        ],
        paging: {
          pageNumber: 1,
          pageSize: 2,
          sortType: 0
        },
        flightType: 2 as const,
        additionalFilters: []
      }
    }];
    const responses: Array<PromiseSettledResult<{ result: { products: Array<{ hotel: { id: string } }> } }>> = [{
      status: "fulfilled",
      value: {
        result: {
          products: [{
            hotel: { id: "22404" }
          }]
        }
      }
    }];

    const fallbackDescriptors = buildFallbackQueryDescriptors({
      descriptors,
      responses
    });

    expect(fallbackDescriptors).toHaveLength(1);
    expect(fallbackDescriptors[0]).toMatchObject({
      hotels: [{
        hotelId: "1675",
        arrivalLocation: { id: "1675-7", type: 7 }
      }],
      searchCriterias: {
        arrivalLocations: [{ id: "1675-7", type: 7 }],
        paging: {
          pageSize: 1
        }
      }
    });
  });

  it("does not create fallback requests for already-complete or single-hotel descriptors", () => {
    const descriptors = [{
      hotels: [{
        hotelId: "1675",
        arrivalLocation: { id: "1675-7", type: 7 }
      }],
      onlyhotel: false,
      searchCriterias: {
        datePickerMode: 0,
        reservationType: 1 as const,
        imageSizes: [4, 7],
        roomCriterias: [{
          passengers: [
            { age: 20, passengerType: 0 },
            { age: 20, passengerType: 0 }
          ]
        }],
        beginDates: ["2026-06-01", "2026-06-30"] as [string, string],
        nights: [{ value: 7 }],
        departureLocations: [{
          id: "2671-5",
          type: 5,
          name: "Москва",
          friendlyUrl: "moskva"
        }],
        arrivalLocations: [{ id: "1675-7", type: 7 }],
        paging: {
          pageNumber: 1,
          pageSize: 1,
          sortType: 0
        },
        flightType: 2 as const,
        additionalFilters: []
      }
    }];
    const responses: Array<PromiseSettledResult<{ result: { products: Array<{ hotel: { id: string } }> } }>> = [{
      status: "fulfilled",
      value: {
        result: {
          products: [{
            hotel: { id: "1675" }
          }]
        }
      }
    }];

    expect(buildFallbackQueryDescriptors({
      descriptors,
      responses
    })).toEqual([]);
  });
});
