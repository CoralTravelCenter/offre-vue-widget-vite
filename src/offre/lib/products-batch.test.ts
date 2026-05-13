import { describe, expect, it } from "vitest";
import { aggregateProductsBatch, resolveProductsRequestState } from "@/offre/lib/products-batch";

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
              products: [{
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
    expect(batch.meta).toMatchObject({
      requestState: "partial",
      failedQueries: 1,
      queryCount: 2
    });
  });
});
