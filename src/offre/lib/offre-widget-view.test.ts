import { describe, expect, it } from "vitest";
import { resolveProductsListState } from "offre/lib/offre-widget-view";

describe("resolveProductsListState", () => {
  it("returns loading state metadata while products are fetching", () => {
    expect(resolveProductsListState({
      requestState: "loading",
      productsError: false,
      productsPartial: false,
      noMatchedProducts: false,
      hasProducts: false
    })).toEqual({
      title: "",
      description: "",
      modifierClass: "offre-widget__state--loading",
      partialMessage: "",
      showRetry: false
    });
  });

  it("returns error state metadata with the agreed notice copy", () => {
    expect(resolveProductsListState({
      requestState: "error",
      productsError: true,
      productsPartial: false,
      noMatchedProducts: false,
      hasProducts: false
    })).toEqual({
      title: "Упс! Что-то пошло не так.",
      description: "Но мы это исправим, попробуйте зайти позже",
      modifierClass: "offre-widget__state--error",
      partialMessage: "",
      showRetry: false
    });
  });

  it("returns warning state and partial message when partial results contain products", () => {
    expect(resolveProductsListState({
      requestState: "partial",
      productsError: false,
      productsPartial: true,
      noMatchedProducts: false,
      hasProducts: true
    })).toEqual({
      title: "Часть туров не загрузилась. Показываем результаты, которые удалось получить.",
      description: "",
      modifierClass: "offre-widget__state--warning",
      partialMessage: "Часть туров не загрузилась. Показываем результаты, которые удалось получить.",
      showRetry: false
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
      title: "Увы, подходящих вариантов нет",
      description: "Попробуйте изменить месяц, регион вылета или состав туристов",
      modifierClass: "offre-widget__state--empty",
      partialMessage: "",
      showRetry: false
    });
  });
});
