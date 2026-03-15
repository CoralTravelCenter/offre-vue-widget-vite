import "styles/index.css";
import { mountOffreWidget } from "app/create-offre-widget-app";
import type { MountedOffreWidget as CoreMountedOffreWidget } from "app/create-offre-widget-app";
import type { WidgetHotelEntry, WidgetOptions, WidgetPayload } from "shared/types/widget";

const WIDGET_SELECTOR = 'script[type="application/json"][data-offre-vue-test]';
const WIDGET_ROOT_ATTR = "data-offre-widget-root";

const mountedWidgetsByScript = new WeakMap<HTMLScriptElement, BootstrappedOffreWidget>();

type UnmountTarget = BootstrappedOffreWidget | HTMLScriptElement;
type WindowUnmountTarget = ParentNode | UnmountTarget;

export interface BootstrappedOffreWidget extends CoreMountedOffreWidget {
  payload: WidgetPayload;
  rootElement: HTMLElement;
  scriptElement: HTMLScriptElement;
  unmount: () => boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function warnWidget(message: string, details?: unknown) {
  if (details === undefined) {
    console.warn(`OffreWidget: ${message}`);
    return;
  }

  console.warn(`OffreWidget: ${message}`, details);
}

function errorWidget(message: string, details?: unknown) {
  if (details === undefined) {
    console.error(`OffreWidget: ${message}`);
    return;
  }

  console.error(`OffreWidget: ${message}`, details);
}

function normalizeWidgetOptions(value: unknown): WidgetOptions {
  return isRecord(value) ? (value as WidgetOptions) : {};
}

function normalizeWidgetHotels(value: unknown): WidgetHotelEntry[] {
  return Array.isArray(value) ? value : [];
}

function normalizeWidgetPayload(rawPayload: unknown): WidgetPayload | null {
  if (!isRecord(rawPayload)) {
    warnWidget("widget payload must be a JSON object");
    return null;
  }

  const payload: WidgetPayload = {};

  if (rawPayload.brand !== undefined) {
    if (typeof rawPayload.brand === "string" && rawPayload.brand.trim()) {
      payload.brand = rawPayload.brand.trim();
    } else {
      warnWidget("payload.brand must be a non-empty string, brand fallback will be used");
    }
  }

  if (rawPayload.options !== undefined && !isRecord(rawPayload.options)) {
    warnWidget("payload.options must be a JSON object, falling back to empty options");
  }

  if (rawPayload.hotels !== undefined && !Array.isArray(rawPayload.hotels)) {
    warnWidget("payload.hotels must be an array, falling back to an empty list");
  }

  payload.options = normalizeWidgetOptions(rawPayload.options);
  payload.hotels = normalizeWidgetHotels(rawPayload.hotels);

  return payload;
}

function parseWidgetPayload(scriptElement: HTMLScriptElement): WidgetPayload | null {
  try {
    const rawPayload = JSON.parse(scriptElement.textContent || "{}") as unknown;
    return normalizeWidgetPayload(rawPayload);
  } catch (error) {
    warnWidget("invalid widget payload", error);
    return null;
  }
}

function getExistingMountedWidget(scriptElement: HTMLScriptElement) {
  const existingWidget = mountedWidgetsByScript.get(scriptElement);

  if (!existingWidget) {
    return null;
  }

  if (existingWidget.rootElement.isConnected) {
    return existingWidget;
  }

  mountedWidgetsByScript.delete(scriptElement);
  return null;
}

function getOrCreateWidgetRoot(scriptElement: HTMLScriptElement) {
  const existingRoot = scriptElement.nextElementSibling;

  if (
    existingRoot instanceof HTMLElement
    && existingRoot.getAttribute(WIDGET_ROOT_ATTR) === "true"
  ) {
    return existingRoot;
  }

  const rootElement = document.createElement("div");
  rootElement.setAttribute(WIDGET_ROOT_ATTR, "true");
  scriptElement.insertAdjacentElement("afterend", rootElement);

  return rootElement;
}

function isMountedWidgetTarget(value: unknown): value is BootstrappedOffreWidget {
  return isRecord(value)
    && value.scriptElement instanceof HTMLScriptElement
    && typeof value.unmount === "function";
}

function resolveScriptElement(target: UnmountTarget) {
  return target instanceof HTMLScriptElement ? target : target.scriptElement;
}

export function mountOffreWidgetFromScript(
  scriptElement: HTMLScriptElement,
): BootstrappedOffreWidget | null {
  const existingWidget = getExistingMountedWidget(scriptElement);

  if (existingWidget) {
    return existingWidget;
  }

  const payload = parseWidgetPayload(scriptElement);

  if (!payload) {
    return null;
  }

  const rootElement = getOrCreateWidgetRoot(scriptElement);

  try {
    const mountedWidget = mountOffreWidget({ container: rootElement, payload });
    const bootstrappedWidget: BootstrappedOffreWidget = {
      ...mountedWidget,
      payload,
      rootElement,
      scriptElement,
      unmount: () => unmountOffreWidget(scriptElement)
    };

    mountedWidgetsByScript.set(scriptElement, bootstrappedWidget);

    return bootstrappedWidget;
  } catch (error) {
    rootElement.remove();
    errorWidget("failed to mount widget", error);
    return null;
  }
}

export function bootstrapOffreWidgets(root: ParentNode = document): BootstrappedOffreWidget[] {
  const widgetScripts = Array.from(root.querySelectorAll<HTMLScriptElement>(WIDGET_SELECTOR));

  return widgetScripts
    .map((scriptElement) => mountOffreWidgetFromScript(scriptElement))
    .filter((widget): widget is BootstrappedOffreWidget => widget !== null);
}

export function unmountOffreWidget(target: UnmountTarget): boolean {
  const scriptElement = resolveScriptElement(target);
  const mountedWidget = mountedWidgetsByScript.get(scriptElement);

  if (!mountedWidget) {
    return false;
  }

  mountedWidget.app.unmount();
  mountedWidget.queryClient.clear();
  mountedWidget.rootElement.remove();
  mountedWidgetsByScript.delete(scriptElement);

  return true;
}

export function unmountOffreWidgets(root: ParentNode = document): number {
  const widgetScripts = Array.from(root.querySelectorAll<HTMLScriptElement>(WIDGET_SELECTOR));

  return widgetScripts.reduce((count, scriptElement) => {
    return count + Number(unmountOffreWidget(scriptElement));
  }, 0);
}

function unmountWindowTarget(target: WindowUnmountTarget = document) {
  if (target instanceof HTMLScriptElement || isMountedWidgetTarget(target)) {
    return unmountOffreWidget(target);
  }

  return unmountOffreWidgets(target);
}

if (typeof window !== "undefined") {
  window.OffreWidget ||= {};
  window.OffreWidget.bootstrap = bootstrapOffreWidgets;
  window.OffreWidget.mount = mountOffreWidgetFromScript;
  window.OffreWidget.unmount = unmountWindowTarget;
}
