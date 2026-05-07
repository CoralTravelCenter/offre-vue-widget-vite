export function resolveProductsListState(params: {
  requestState: string;
  productsError: boolean;
  productsPartial: boolean;
  noMatchedProducts: boolean;
  hasProducts: boolean;
}) {
  if (params.requestState === "loading") {
    return {
      title: "",
      description: "",
      modifierClass: "offre-widget__state--loading",
      partialMessage: "",
      showRetry: false
    };
  }

  if (params.productsError) {
    return {
      title: "Упс! Что-то пошло не так, но мы это исправим, попробуйте зайти позже.",
      description: "",
      modifierClass: "offre-widget__state--error",
      partialMessage: "",
      showRetry: true
    };
  }

  if (params.productsPartial) {
    return {
      title: "Часть туров не загрузилась. Показываем результаты, которые удалось получить.",
      description: "",
      modifierClass: "offre-widget__state--warning",
      partialMessage: params.hasProducts
        ? "Часть туров не загрузилась. Показываем результаты, которые удалось получить."
        : "",
      showRetry: false
    };
  }

  if (params.noMatchedProducts) {
    return {
      title: "Увы, подходящих вариантов нет",
      description: "Попробуйте изменить месяц, регион вылета или состав туристов",
      modifierClass: "offre-widget__state--empty",
      partialMessage: "",
      showRetry: false
    };
  }

  return {
    title: "",
    description: "",
    modifierClass: "",
    partialMessage: "",
    showRetry: false
  };
}
