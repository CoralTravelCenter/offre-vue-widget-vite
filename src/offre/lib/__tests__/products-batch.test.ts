import { describe, expect, it } from "vitest";
import {
  aggregateProductsBatch,
  dedupeProductsByHotelId,
  getPriceSearchProducts,
  resolveProductsRequestState
} from "@/offre/lib/products-batch";

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

describe("aggregateProductsBatch", () => {
  it("dedupes duplicate hotel ids and keeps the cheaper product", () => {
    expect(dedupeProductsByHotelId([
      {
        hotel: { id: 10 },
        offers: [{ price: { amount: 2000 } }]
      },
      {
        hotel: { id: 10 },
        offers: [{ price: { amount: 1500 } }]
      },
      {
        hotel: { id: 20 },
        offers: [{ price: { amount: 3000 } }]
      }
    ])).toEqual([
      {
        hotel: { id: 10 },
        offers: [{ price: { amount: 1500 } }]
      },
      {
        hotel: { id: 20 },
        offers: [{ price: { amount: 3000 } }]
      }
    ]);
  });

  it("falls back to topProducts when products are empty", () => {
    expect(getPriceSearchProducts({
      products: [],
      topProducts: [{
        hotel: { id: 1 },
        offers: [{ price: { amount: 100 } }]
      }]
    })).toEqual([{
      hotel: { id: 1 },
      offers: [{ price: { amount: 100 } }]
    }]);
  });

  it("sorts products by source order and merges references", () => {
    const batch = aggregateProductsBatch({
      responses: [
        {
          status: "fulfilled",
          value: {
            result: {
              products: [{
                hotel: { id: 2 },
                offers: [{ price: { amount: 2000 } }]
              }],
              meals: {
                ai: { name: "AI" }
              }
            }
          }
        },
        {
          status: "fulfilled",
          value: {
            result: {
              products: [{
                hotel: { id: 1 },
                offers: [{ price: { amount: 1000 } }]
              }],
              hotelCategories: {
                deluxe: { starCount: 5 }
              }
            }
          }
        }
      ],
      options: {
        groupBy: "countries",
        chartersOnly: false,
        pricing: "default",
        theme: "default",
        timeframe: { fluid: ["P14D", "P115D"], monthly: true },
        nights: [7],
        regionsOrder: [],
        sortBy: "source"
      },
      hotelOrderById: new Map([
        ["1", 0],
        ["2", 1]
      ])
    });

    expect(batch.payload.products.map((product) => String(product.hotel?.id))).toEqual(["1", "2"]);
    expect(batch.payload.reference).toMatchObject({
      meals: {
        ai: { name: "AI" }
      },
      hotelCategories: {
        deluxe: { starCount: 5 }
      }
    });
    expect(batch.meta).toMatchObject({
      requestState: "success",
      failedQueries: 0,
      queryCount: 2
    });
  });

  it("marks partial when one response fails and still returns successful products", () => {
    const batch = aggregateProductsBatch({
      responses: [
        {
          status: "fulfilled",
          value: {
            result: {
              topProducts: [{
                hotel: { id: 1 },
                offers: [{ price: { amount: 3000 } }]
              }]
            }
          }
        },
        {
          status: "rejected",
          reason: new Error("network")
        }
      ],
      options: {
        groupBy: "countries",
        chartersOnly: false,
        pricing: "default",
        theme: "default",
        timeframe: { fluid: ["P14D", "P115D"], monthly: true },
        nights: [7],
        regionsOrder: [],
        sortBy: "price"
      },
      hotelOrderById: new Map()
    });

    expect(batch.payload.products).toHaveLength(1);
    expect(batch.payload.products[0]?.hotel?.id).toBe(1);
    expect(batch.meta).toMatchObject({
      requestState: "partial",
      failedQueries: 1,
      queryCount: 2
    });
  });

  it("preserves backend response order for price sorting", () => {
    const batch = aggregateProductsBatch({
      responses: [
        {
          status: "fulfilled",
          value: {
            result: {
              products: [
                {
                  hotel: { id: 30 },
                  offers: [{ price: { amount: 9000 } }]
                },
                {
                  hotel: { id: 10 },
                  offers: [{ price: { amount: 3000 } }]
                },
                {
                  hotel: { id: 20 },
                  offers: [{ price: { amount: 6000 } }]
                }
              ]
            }
          }
        }
      ],
      options: {
        groupBy: "countries",
        chartersOnly: false,
        pricing: "default",
        theme: "default",
        timeframe: { fluid: ["P14D", "P115D"], monthly: true },
        nights: [7],
        regionsOrder: [],
        sortBy: "price"
      },
      hotelOrderById: new Map([
        ["30", 0],
        ["10", 1],
        ["20", 2]
      ])
    });

    expect(batch.payload.products.map((product) => String(product.hotel?.id))).toEqual(["30", "10", "20"]);
  });

  it("removes duplicate hotels across merged responses", () => {
    const batch = aggregateProductsBatch({
      responses: [
        {
          status: "fulfilled",
          value: {
            result: {
              products: [{
                hotel: { id: 1 },
                offers: [{ price: { amount: 3000 } }]
              }]
            }
          }
        },
        {
          status: "fulfilled",
          value: {
            result: {
              products: [{
                hotel: { id: 1 },
                offers: [{ price: { amount: 2500 } }]
              }]
            }
          }
        }
      ],
      options: {
        groupBy: "countries",
        chartersOnly: false,
        pricing: "default",
        theme: "default",
        timeframe: { fluid: ["P14D", "P115D"], monthly: true },
        nights: [7],
        regionsOrder: [],
        sortBy: "price"
      },
      hotelOrderById: new Map([["1", 0]])
    });

    expect(batch.payload.products).toHaveLength(1);
    expect(batch.payload.products[0]?.hotel?.id).toBe(1);
    expect(batch.payload.products[0]?.offers?.[0]?.price?.amount).toBe(2500);
  });
});
