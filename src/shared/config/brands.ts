import type { BrandDefinition, BrandKey } from "shared/types/brand";
import coralBrand from "brands/coral";
import sunmarBrand from "brands/sunmar";

const brandRegistry: Record<BrandKey, BrandDefinition> = {
  coral: coralBrand,
  sunmar: sunmarBrand
};

function isSupportedBrandKey(value: string | null | undefined): value is BrandKey {
  return value === "coral" || value === "sunmar";
}

export function resolveBrandKeyByHostname(hostname: string | null | undefined) {
  const normalizedHostname = String(hostname ?? "").trim().toLowerCase();

  if (!normalizedHostname) {
    return null;
  }

  if (normalizedHostname === "sunmar.ru" || normalizedHostname.endsWith(".sunmar.ru")) {
    return "sunmar" satisfies BrandKey;
  }

  if (normalizedHostname === "coral.ru" || normalizedHostname.endsWith(".coral.ru")) {
    return "coral" satisfies BrandKey;
  }

  return null;
}

function getBrowserHostname() {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.location.hostname;
}

export function resolveBrandDefinition(
  brandKey: string | null | undefined,
  options: { hostname?: string | null } = {}
) {
  if (isSupportedBrandKey(brandKey)) {
    return brandRegistry[brandKey];
  }

  const resolvedBrandKey = resolveBrandKeyByHostname(options.hostname ?? getBrowserHostname());

  if (resolvedBrandKey) {
    return brandRegistry[resolvedBrandKey];
  }

  return coralBrand;
}

export function getSupportedBrands() {
  return Object.values(brandRegistry) as BrandDefinition[];
}
