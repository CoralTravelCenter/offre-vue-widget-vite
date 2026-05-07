import { VueQueryPlugin, type QueryClient } from "@tanstack/vue-query";
import { createApp, type App, type ComponentPublicInstance } from "vue";
import { createWidgetQueryClient } from "app/create-widget-query-client";
import citySpelling from "app/plugins/city-spelling";
import fixedDirective from "directives/fixed";
import OffreWidgetRoot from "offre/components/OffreWidgetRoot.vue";
import { gcOffreQueryPersisters } from "offre/query/persister";
import { getSupportedBrands, resolveBrandDefinition } from "shared/config/brands";
import type { BrandDefinition } from "shared/types/brand";
import type { WidgetHotelEntry, WidgetOptions, WidgetPayload } from "shared/types/widget";

interface CreateOffreWidgetAppParams {
  container: Element;
  payload: WidgetPayload;
}

interface CreateOffreWidgetAppResult {
  app: App<Element>;
  brandDefinition: BrandDefinition;
  container: Element;
  queryClient: QueryClient;
}

export interface MountedOffreWidget {
  app: App<Element>;
  instance: ComponentPublicInstance;
  brandDefinition: BrandDefinition;
  container: Element;
  queryClient: QueryClient;
}

const ROOT_THEME_VARIABLES = [
  "--background",
  "--foreground",
  "--card",
  "--card-foreground",
  "--popover",
  "--popover-foreground",
  "--primary",
  "--primary-foreground",
  "--secondary",
  "--secondary-foreground",
  "--muted",
  "--muted-foreground",
  "--accent",
  "--accent-foreground",
  "--destructive",
  "--destructive-foreground",
  "--border",
  "--input",
  "--ring",
  "--radius",
  "--shadow-xs",
  "--shadow-sm",
  "--shadow-md",
  "--shadow",
  "--brand-background",
  "--brand-foreground",
  "--brand-card",
  "--brand-card-foreground",
  "--brand-popover",
  "--brand-popover-foreground",
  "--brand-primary",
  "--brand-primary-foreground",
  "--brand-secondary",
  "--brand-secondary-foreground",
  "--brand-muted",
  "--brand-muted-foreground",
  "--brand-accent",
  "--brand-accent-foreground",
  "--brand-destructive",
  "--brand-destructive-foreground",
  "--brand-warning",
  "--brand-border",
  "--brand-border-popover-row",
  "--brand-input",
  "--brand-ring",
  "--brand-control-border",
  "--brand-star",
  "--brand-discount",
  "--brand-discount-fold",
  "--brand-exclusive",
  "--brand-selected-surface",
  "--brand-glow-bonus-soft",
  "--brand-glow-bonus-strong",
  "--brand-skeleton-base",
  "--brand-skeleton-accent",
  "--brand-shadow-widget",
  "--brand-shadow-popover",
  "--brand-radius-shell",
  "--brand-radius-panel",
  "--brand-radius-control",
  "--brand-radius-chip",
  "--brand-radius-chip-foreground",
  "--brand-radius-card",
  "--brand-radius-media",
  "--brand-radius-segment",
  "--brand-radius-badge",
  "--brand-radius-button",
  "--brand-control-padding-x",
  "--brand-control-padding-y",
  "--brand-control-height",
  "--brand-control-height-compact",
  "--brand-control-padding-x-compact",
  "--brand-control-padding-y-compact",
  "--brand-text-caption",
  "--brand-text-meta",
  "--brand-text-body",
  "--brand-text-control",
  "--brand-text-control-compact",
  "--brand-text-button",
  "--brand-text-title",
  "--brand-text-price",
  "--brand-text-price-suffix",
  "--brand-leading-meta",
  "--brand-leading-control",
  "--brand-leading-control-compact",
  "--brand-leading-button",
  "--brand-leading-title",
  "--brand-cashback-card-width",
  "--brand-cashback-banner-background",
  "--brand-cashback-banner-radius",
  "--brand-offer-card-media-height",
  "--brand-offer-card-media-height-lg",
  "--brand-offer-card-media-height-xl",
  "--brand-guest-age-option-size",
  "--brand-guest-age-grid-gap",
  "--brand-guest-age-toggle-min-width",
  "--brand-guest-popover-min-width",
  "--brand-guest-age-toggle-padding",
  "--brand-guest-age-toggle-radius",
  "--brand-guest-age-toggle-background",
  "--brand-stepper-gap",
  "--brand-stepper-button-size",
  "--brand-stepper-button-radius",
  "--brand-stepper-button-background",
  "--brand-stepper-button-foreground",
  "--brand-stepper-icon-size",
  "--brand-stepper-value-min-width"
] as const;

function getWidgetOptions(payload: WidgetPayload): WidgetOptions {
  return (payload.options ?? {}) as WidgetOptions;
}

function getWidgetHotels(payload: WidgetPayload): WidgetHotelEntry[] {
  return Array.isArray(payload.hotels) ? payload.hotels : [];
}

function applyBrandTheme(container: Element, brandDefinition: BrandDefinition) {
  container.classList.remove(...getSupportedBrands().map((brand) => brand.themeClass));
  container.classList.add("offre-widget-host", brandDefinition.themeClass);
  container.setAttribute("data-offre-brand", brandDefinition.key);

  if (typeof document === "undefined") {
    return;
  }

  const rootStyle = document.documentElement.style;
  const computedTheme = getComputedStyle(container);

  for (const variableName of ROOT_THEME_VARIABLES) {
    const variableValue = computedTheme.getPropertyValue(variableName).trim();

    if (!variableValue) {
      continue;
    }

    rootStyle.setProperty(variableName, variableValue);
  }
}

export function createOffreWidgetApp({ container, payload }: CreateOffreWidgetAppParams): CreateOffreWidgetAppResult {
  const brandDefinition = resolveBrandDefinition(payload?.brand);
  const queryClient = createWidgetQueryClient();

  void gcOffreQueryPersisters();
  applyBrandTheme(container, brandDefinition);

  const app = createApp(OffreWidgetRoot, {
    brandKey: brandDefinition.key,
    brandDefinition,
    options: getWidgetOptions(payload),
    hotelsList: getWidgetHotels(payload)
  });

  app.use(VueQueryPlugin, { queryClient });
  app.use(citySpelling);
  app.directive("fixed", fixedDirective);
  app.config.globalProperties.$offreBrand = brandDefinition.key;

  return { app, brandDefinition, container, queryClient };
}

export function mountOffreWidget({ container, payload }: CreateOffreWidgetAppParams): MountedOffreWidget {
  const { app, brandDefinition, queryClient } = createOffreWidgetApp({ container, payload });
  const instance = app.mount(container) as ComponentPublicInstance;

  return {
    app,
    instance,
    brandDefinition,
    container,
    queryClient
  };
}
