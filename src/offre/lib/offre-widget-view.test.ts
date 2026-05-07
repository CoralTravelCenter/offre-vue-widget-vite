import { describe, expect, it } from "vitest";
import { resolveProductsListState } from "offre/lib/offre-widget-view";

describe("resolveProductsListState", () => {
  it("returns warning state and partial message when partial results contain products", () => {
    expect(resolveProductsListState({
      requestState: "partial",
      productsError: false,
      productsPartial: true,
      noMatchedProducts: false,
      hasProducts: true
    })).toEqual({
      message: "Часть туров не загрузилась. Показываем результаты, которые удалось получить.",
      modifierClass: "offre-widget__state--warning",
      partialMessage: "Часть туров не загрузилась. Показываем результаты, которые удалось получить."
    });
  });

  it("returns empty state when no products were matched", () => {
    expect(resolveProductsListState({
      requestState: "success",
      productsError: false,
      productsPartial: false,
      noMatchedProducts: true,
      hasProducts: false
    })).toEqual({
      message: "По выбранным параметрам ничего не найдено",
      modifierClass: "offre-widget__state--empty",
      partialMessage: ""
    });
  });
});
