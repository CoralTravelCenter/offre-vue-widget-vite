import { describe, expect, it } from "vitest";
import type { OffreProductQueryDescriptor } from "@/offre/lib/search-criterias";
import type { OffreHotelRuntimeEntry } from "@/offre/types";
import {
  buildProductsQueryDescriptorsDebugPayload,
  buildProductsQueryTimingDebugPayload,
  resolveNoMatchedProducts,
  resolveProductsError,
  resolveProductsQueryMode,
  resolveProductsRequestState
} from "@/offre/composables/useOffreProductsQuery.helpers";

function createHotel(id: string): OffreHotelRuntimeEntry {
  return {
    id,
    onlyhotel: false,
    usps: [],
    timeframes: [{
      key: "jun",
      searchFields: {
        beginDates: ["2026-06-01", "2026-06-30"],
        nights: [7]
      }
    }]
  };
}

function createDescriptor(hotelIds: string[]): OffreProductQueryDescriptor {
  return {
    onlyhotel: false,
    hotels: hotelIds.map((hotelId) => ({
      hotelId,
      arrivalLocation: { id: "shared", type: 7 }
    })),
    searchCriterias: {
      datePickerMode: 0,
      roomCriterias: [{ passengers: [{ age: 20, passengerType: 0 }] }],
      reservationType: 1,
      imageSizes: [4, 7],
      beginDates: ["2026-06-01", "2026-06-30"],
      nights: [{ value: 7 }],
      departureLocations: [{ id: "2671-5", type: 5, name: "Москва" }],
      arrivalLocations: [{ id: "shared", type: 7 }],
      paging: { pageNumber: 1, pageSize: hotelIds.length, sortType: 0 },
      flightType: 2,
      additionalFilters: []
    }
  };
}

describe("useOffreProductsQuery helpers", () => {
  it("resolves query mode and slices effective hotels for server page mode", () => {
    const hotels = [createHotel("101"), createHotel("202"), createHotel("303")];
    const queryMode = resolveProductsQueryMode({
      hotels,
      pageSize: 2,
      currentPage: 1,
      serverPageMode: true
    });

    expect(queryMode).toMatchObject({
      pageSize: 2,
      currentPage: 1,
      serverPageMode: true,
      totalHotels: 3
    });
    expect(queryMode.effectiveHotels.map((hotel) => hotel.id)).toEqual(["101", "202"]);
  });

  it("builds stable debug payloads for descriptors and timing", () => {
    const queryMode = resolveProductsQueryMode({
      hotels: [createHotel("101"), createHotel("202")],
      pageSize: 2,
      currentPage: 1,
      serverPageMode: true
    });
    const descriptors = [createDescriptor(["101", "202"])];

    expect(buildProductsQueryDescriptorsDebugPayload(queryMode, descriptors)).toMatchObject({
      effectiveHotelIds: ["101", "202"],
      primaryDescriptors: [{
        hotelCount: 2,
        hotelIds: ["101", "202"],
        arrivalLocationCount: 1
      }]
    });

    expect(buildProductsQueryTimingDebugPayload({
      queryMode,
      productQueryDescriptors: descriptors,
      totalDurationMs: 120,
      primaryDurationMs: 90,
      batchResult: {
        payload: {
          products: [{ hotel: { id: "101" } }, { hotel: { id: "202" } }],
          reference: {}
        },
        meta: {
          requestState: "success",
          failedQueries: 0,
          queryCount: 1
        }
      }
    })).toMatchObject({
      totalDurationMs: 120,
      primaryDurationMs: 90,
      primaryQueryCount: 1,
      primaryHotelCount: 2,
      resultProducts: 2
    });
  });

  it("derives request state, no-match, and error flags from query state", () => {
    expect(resolveProductsRequestState({
      queryEnabled: false,
      isPending: false,
      isError: false,
      productsCount: 0
    })).toBe("idle");

    expect(resolveProductsRequestState({
      queryEnabled: true,
      isPending: true,
      isError: false,
      productsCount: 0
    })).toBe("loading");

    expect(resolveProductsRequestState({
      queryEnabled: true,
      isPending: false,
      isError: false,
      productsCount: 0,
      batchRequestState: "partial"
    })).toBe("partial");

    expect(resolveNoMatchedProducts({
      descriptorsCount: 2,
      isPending: false,
      isError: false,
      productsCount: 0
    })).toBe(true);

    expect(resolveProductsError({
      isError: false,
      batchRequestState: "error"
    })).toBe(true);
  });
});
