import { describe, expect, it } from "vitest";
import {
  resolveBrandDefinition,
  resolveBrandKeyByHostname,
  resolveBrandThemeClass,
  resolveWidgetTheme
} from "@/brands/registry";

describe("brand resolution", () => {
  it("detects sunmar by hostname when payload brand is missing", () => {
    expect(resolveBrandKeyByHostname("www.sunmar.ru")).toBe("sunmar");
    expect(resolveBrandDefinition(undefined, { hostname: "www.sunmar.ru" }).key).toBe("sunmar");
  });

  it("detects coral by hostname when payload brand is missing", () => {
    expect(resolveBrandKeyByHostname("www.coral.ru")).toBe("coral");
    expect(resolveBrandDefinition(undefined, { hostname: "www.coral.ru" }).key).toBe("coral");
  });

  it("falls back to coral for unknown hostname or non-browser execution", () => {
    expect(resolveBrandKeyByHostname("example.com")).toBeNull();
    expect(resolveBrandDefinition(undefined, { hostname: "example.com" }).key).toBe("coral");
    expect(resolveBrandDefinition(undefined, { hostname: undefined }).key).toBe("coral");
  });

  it("prefers explicit payload brand over hostname fallback", () => {
    expect(resolveBrandDefinition("coral", { hostname: "www.sunmar.ru" }).key).toBe("coral");
    expect(resolveBrandDefinition("sunmar", { hostname: "www.coral.ru" }).key).toBe("sunmar");
  });

  it("resolves coral elite as a separate theme variant", () => {
    const coralBrand = resolveBrandDefinition("coral");

    expect(resolveWidgetTheme("elite")).toBe("elite");
    expect(resolveBrandThemeClass({
      brandDefinition: coralBrand,
      theme: "elite"
    })).toBe("offre-theme--coral-elite");
  });

  it("resolves coral dark as a separate theme variant", () => {
    const coralBrand = resolveBrandDefinition("coral");

    expect(resolveWidgetTheme("dark")).toBe("dark");
    expect(resolveBrandThemeClass({
      brandDefinition: coralBrand,
      theme: "dark"
    })).toBe("offre-theme--coral-dark");
  });

  it("falls back to the base brand theme for unsupported variants", () => {
    const sunmarBrand = resolveBrandDefinition("sunmar");

    expect(resolveWidgetTheme("unexpected")).toBe("default");
    expect(resolveBrandThemeClass({
      brandDefinition: sunmarBrand,
      theme: "elite"
    })).toBe("offre-theme--sunmar");
  });
});
