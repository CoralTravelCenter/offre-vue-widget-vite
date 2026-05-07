import { describe, expect, it } from "vitest";
import { resolveProductsRequestState } from "offre/lib/products-batch";

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
