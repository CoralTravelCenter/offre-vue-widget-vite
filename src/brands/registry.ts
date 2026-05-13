import type { BrandDefinition, BrandKey } from "@/brands/types";
import type { WidgetOptions, WidgetTheme } from "@/widget/types";
import coralBrand from "@/brands/coral";
import sunmarBrand from "@/brands/sunmar";

const brandRegistry: Record<BrandKey, BrandDefinition> = {
  coral: coralBrand,
  sunmar: sunmarBrand
};
const themeClasses = [
  ...Object.values(brandRegistry).map((brand) => brand.themeClass),
  "offre-theme--coral-elite",
  "offre-theme--coral-dark"
] as const;

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

export function getSupportedThemeClasses() {
  return [...themeClasses];
}

export function resolveWidgetTheme(value: WidgetOptions["theme"]): WidgetTheme {
  if (value === "elite" || value === "dark") {
    return value;
  }

  return "default";
}

export function resolveBrandThemeClass(params: {
  brandDefinition: BrandDefinition;
  theme?: WidgetOptions["theme"];
}) {
  const resolvedTheme = resolveWidgetTheme(params.theme);

  if (params.brandDefinition.key === "coral" && resolvedTheme === "elite") {
    return "offre-theme--coral-elite";
  }

  if (params.brandDefinition.key === "coral" && resolvedTheme === "dark") {
    return "offre-theme--coral-dark";
  }

  return params.brandDefinition.themeClass;
}
