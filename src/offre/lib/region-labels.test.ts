import { describe, expect, it } from "vitest";
import {
  cleanOffreRegionLabel,
  normalizeOffreRegionLabelForCompare
} from "offre/lib/region-labels";

describe("offre region labels", () => {
  it("removes latin alias in trailing parentheses", () => {
    expect(cleanOffreRegionLabel("Бодрум (Bodrum)")).toBe("Бодрум");
    expect(cleanOffreRegionLabel("Аланья (Alanya)")).toBe("Аланья");
  });

  it("keeps labels without latin alias unchanged", () => {
    expect(cleanOffreRegionLabel("Москва")).toBe("Москва");
    expect(cleanOffreRegionLabel("Санкт-Петербург (СПб)")).toBe("Санкт-Петербург (СПб)");
  });

  it("normalizes labels for config comparisons", () => {
    expect(normalizeOffreRegionLabelForCompare(" Бодрум (Bodrum) ")).toBe("бодрум");
    expect(normalizeOffreRegionLabelForCompare("Аланья")).toBe("аланья");
  });
});
