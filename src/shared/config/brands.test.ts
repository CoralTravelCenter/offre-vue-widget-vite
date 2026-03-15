import { describe, expect, it } from "vitest";
import { resolveBrandDefinition, resolveBrandKeyByHostname } from "shared/config/brands";

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
});
