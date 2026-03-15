import { VueQueryPlugin, type QueryClient } from "@tanstack/vue-query";
import { createApp, type App, type ComponentPublicInstance } from "vue";
import { createWidgetQueryClient } from "app/create-widget-query-client";
import citySpelling from "app/plugins/city-spelling";
import stickyDirective from "directives/sticky";
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
  app.directive("sticky", stickyDirective);
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
