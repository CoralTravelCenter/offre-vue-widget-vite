export function resolveSelectedValue<TItem>(params: {
  items: TItem[];
  currentValue: string;
  getValue: (item: TItem) => string;
  getFallbackValue: (items: TItem[]) => string;
}) {
  const { items, currentValue, getValue, getFallbackValue } = params;

  if (currentValue && items.some((item) => getValue(item) === currentValue)) {
    return currentValue;
  }

  return getFallbackValue(items);
}
