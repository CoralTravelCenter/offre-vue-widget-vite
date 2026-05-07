import { describe, expect, it } from "vitest";
import { resolveSelectedValue } from "offre/lib/filter-selection";
import { resolvePreferredDepartureId, resolvePreferredRegionId, WILDCARD_REGION_ID } from "offre/lib/filter-state";

describe("resolveSelectedValue", () => {
  it("keeps current value when it is still present", () => {
    const selected = resolveSelectedValue({
      items: [{ id: "a" }, { id: "b" }],
      currentValue: "b",
      getValue: (item) => item.id,
      getFallbackValue: () => "a"
    });

    expect(selected).toBe("b");
  });

  it("falls back when current value is missing", () => {
    const selected = resolveSelectedValue({
      items: [{ id: "a" }, { id: "b" }],
      currentValue: "c",
      getValue: (item) => item.id,
      getFallbackValue: (items) => items[0]?.id ?? ""
    });

    expect(selected).toBe("a");
  });
});

describe("filter state fallbacks", () => {
  it("prefers requested departure city", () => {
    const departureId = resolvePreferredDepartureId([
      { id: "1", type: 1, label: "Москва", isCurrent: false },
      { id: "2", type: 1, label: "Сочи", isCurrent: true }
    ], "москва");

    expect(departureId).toBe("1");
  });

  it("returns wildcard region when configured and preferred region is absent", () => {
    const regionId = resolvePreferredRegionId([
      { id: "hurghada", label: "Хургада" },
      { id: "sharm", label: "Шарм-эль-Шейх" }
    ], "Все отели", "Марса-Алам");

    expect(regionId).toBe(WILDCARD_REGION_ID);
  });
});
