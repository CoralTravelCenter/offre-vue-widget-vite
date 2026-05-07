import { ref, watch, type MaybeRefOrGetter, type Ref } from "vue";
import { toValue } from "vue";
import { resolveSelectedValue } from "offre/lib/filter-selection";

export function useResolvedSelection<TItem>(params: {
  itemsSource: MaybeRefOrGetter<TItem[]>;
  getValue: (item: TItem) => string;
  getFallbackValue: (items: TItem[]) => string;
  initialValue?: string;
}) {
  const selectedValue = ref(params.initialValue ?? "");

  watch(
    () => toValue(params.itemsSource),
    (nextItems) => {
      selectedValue.value = resolveSelectedValue({
        items: nextItems,
        currentValue: selectedValue.value,
        getValue: params.getValue,
        getFallbackValue: params.getFallbackValue
      });
    },
    { immediate: true }
  );

  function setSelectedValue(nextValue: string) {
    if (!nextValue) {
      return;
    }

    selectedValue.value = nextValue;
  }

  return {
    selectedValue,
    setSelectedValue
  };
}
