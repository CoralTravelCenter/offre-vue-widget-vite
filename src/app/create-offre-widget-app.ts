import { VueQueryPlugin, type QueryClient } from "@tanstack/vue-query";
import { createApp, type App, type ComponentPublicInstance } from "vue";
import {createWidgetInstanceId} from "@/app/create-widget-instance-id";
import {offrePortalTargetKey} from "@/app/offre-portal-target";
import { createWidgetQueryClient } from "@/app/create-widget-query-client";
import fixedDirective from "@/app/fixed-directive";
import OffreWidgetRoot from "@/offre/components/OffreWidgetRoot/OffreWidgetRoot.vue";
import {normalizeRuntimeWidgetPayload} from "@/offre/lib/payload";
import { gcOffreQueryPersisters } from "@/offre/query";
import {
  resolveBrandDefinition,
  resolveBrandThemeClass,
  resolveWidgetTheme,
  getSupportedThemeClasses
} from "@/brands/registry";
import type { BrandDefinition } from "@/brands/types";
import type { WidgetOptions, WidgetPayload } from "@/widget/types";
import { markOffrePerformance, OFFRE_PERFORMANCE_MARKS } from "@/lib/offre-performance";

interface CreateOffreWidgetAppParams {
  container: Element;
  payload: WidgetPayload;
}

interface CreateOffreWidgetAppResult {
  app: App<Element>;
  brandDefinition: BrandDefinition;
  container: Element;
  queryClient: QueryClient;
  instanceId: string;
}

export interface MountedOffreWidget {
  app: App<Element>;
  instance: ComponentPublicInstance;
  brandDefinition: BrandDefinition;
  container: Element;
  queryClient: QueryClient;
  instanceId: string;
}

function applyBrandTheme(container: Element, brandDefinition: BrandDefinition, options: WidgetOptions) {
  const variantThemeClass = resolveBrandThemeClass({
    brandDefinition,
    theme: options.theme
  });
  const resolvedTheme = resolveWidgetTheme(options.theme);

  container.classList.remove(...getSupportedThemeClasses());
  container.classList.add("offre-widget-host", brandDefinition.themeClass);

  if (variantThemeClass !== brandDefinition.themeClass) {
    container.classList.add(variantThemeClass);
  }

  container.setAttribute("data-offre-brand", brandDefinition.key);
  container.setAttribute("data-offre-theme", resolvedTheme);
}

export function createOffreWidgetApp({ container, payload }: CreateOffreWidgetAppParams): CreateOffreWidgetAppResult {
  const normalizedPayload = normalizeRuntimeWidgetPayload(payload);
  const brandDefinition = resolveBrandDefinition(normalizedPayload.brand);
  const widgetOptions = normalizedPayload.options;
  const queryClient = createWidgetQueryClient();
  const instanceId = createWidgetInstanceId();

  void gcOffreQueryPersisters();
  applyBrandTheme(container, brandDefinition, widgetOptions);
  container.setAttribute("data-offre-widget-instance", instanceId);

  const rootProps = {
    instanceId,
    brandKey: brandDefinition.key,
    brandDefinition,
    options: widgetOptions,
    hotelsList: normalizedPayload.hotels
  };
  const app = createApp(OffreWidgetRoot, rootProps);

  app.use(VueQueryPlugin, { queryClient });
  app.directive("fixed", fixedDirective);
  app.provide(offrePortalTargetKey, container as HTMLElement);

  return { app, brandDefinition, container, queryClient, instanceId };
}

export function mountOffreWidget({ container, payload }: CreateOffreWidgetAppParams): MountedOffreWidget {
  const { app, brandDefinition, queryClient, instanceId } = createOffreWidgetApp({ container, payload });
  const instance = app.mount(container) as ComponentPublicInstance;

  markOffrePerformance(OFFRE_PERFORMANCE_MARKS.mounted, {
    instanceId,
    brand: brandDefinition.key
  });

  return {
    app,
    instance,
    brandDefinition,
    container,
    queryClient,
    instanceId
  };
}
