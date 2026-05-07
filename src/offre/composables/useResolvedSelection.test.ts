import { computed, nextTick, ref } from "vue";
import { describe, expect, it } from "vitest";
import { useResolvedSelection } from "offre/composables/useResolvedSelection";

describe("useResolvedSelection", () => {
  it("keeps selected value while it remains available", async () => {
    const items = ref([{ id: "a" }, { id: "b" }]);
    const selection = useResolvedSelection({
      itemsSource: computed(() => items.value),
      getValue: (item) => item.id,
      getFallbackValue: (nextItems) => nextItems[0]?.id ?? ""
    });

    selection.setSelectedValue("b");
    items.value = [{ id: "b" }, { id: "c" }];

    await nextTick();

    expect(selection.selectedValue.value).toBe("b");
  });

  it("falls back when selected value disappears", async () => {
    const items = ref([{ id: "a" }, { id: "b" }]);
    const selection = useResolvedSelection({
      itemsSource: computed(() => items.value),
      getValue: (item) => item.id,
      getFallbackValue: (nextItems) => nextItems[0]?.id ?? ""
    });

    selection.setSelectedValue("b");
    items.value = [{ id: "c" }, { id: "d" }];

    await nextTick();

    expect(selection.selectedValue.value).toBe("c");
  });
});
