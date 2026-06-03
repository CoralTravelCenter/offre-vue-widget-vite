import "@/styles/style.css";
import type {MountedOffreWidget as CoreMountedOffreWidget} from "@/app/create-offre-widget-app";
import {mountOffreWidget} from "@/app/create-offre-widget-app";
import { shouldDebugOffreRequests } from "@/offre/api";
import {sanitizeWidgetPayload} from "@/offre/lib/payload";
import { isPlainObject } from "@/offre/lib/payload-utils";
import type {WidgetPayload} from "@/widget/types";

const WIDGET_SELECTOR = 'script[type="application/json"][data-offre-vue-test]';
const WIDGET_ROOT_ATTR = "data-offre-widget-root";
const WIDGET_MOUNT_ATTR = "data-offre-widget-mount";
const WIDGET_SCRIPT_MOUNTED_ATTR = "data-offre-widget-mounted";
const WIDGET_SCRIPT_INSTANCE_ATTR = "data-offre-widget-instance-id";
const WIDGET_ROOT_INSTANCE_ATTR = "data-offre-widget-instance-id";
const WIDGET_REGISTRY_KEY = "__offreMountedWidgetsByInstanceId";

const mountedWidgetsByScript = new WeakMap<HTMLScriptElement, BootstrappedOffreWidget>();

type UnmountTarget = BootstrappedOffreWidget | HTMLScriptElement;
type WindowUnmountTarget = ParentNode | UnmountTarget;

export interface BootstrappedOffreWidget extends CoreMountedOffreWidget {
    payload: WidgetPayload;
    rootElement: HTMLElement;
    scriptElement: HTMLScriptElement;
    unmount: () => boolean;
}

function getMountedWidgetsByInstanceId() {
    const scope = globalThis as typeof globalThis & {
        [WIDGET_REGISTRY_KEY]?: Map<string, BootstrappedOffreWidget>;
    };

    scope[WIDGET_REGISTRY_KEY] ||= new Map<string, BootstrappedOffreWidget>();
    return scope[WIDGET_REGISTRY_KEY];
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

function logWidgetDebug(message: string, details: Record<string, unknown>) {
    if (!shouldDebugOffreRequests()) {
        return;
    }

    console.info(`OffreWidget: ${message} ${JSON.stringify(details)}`);
}

function normalizeWidgetPayload(rawPayload: unknown): WidgetPayload | null {
    if (!isPlainObject(rawPayload)) {
        warnWidget("widget payload must be a JSON object");
        return null;
    }

    if (rawPayload.brand !== undefined) {
        if (!(typeof rawPayload.brand === "string" && rawPayload.brand.trim())) {
            warnWidget("payload.brand must be a non-empty string, brand fallback will be used");
        }
    }

    if (rawPayload.options !== undefined && !isPlainObject(rawPayload.options)) {
        warnWidget("payload.options must be a JSON object, falling back to empty options");
    }

    if (rawPayload.hotels !== undefined && !Array.isArray(rawPayload.hotels)) {
        warnWidget("payload.hotels must be an array, falling back to an empty list");
    }

    return sanitizeWidgetPayload(rawPayload);
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
    const mountedWidgetsByInstanceId = getMountedWidgetsByInstanceId();
    const persistedInstanceId = scriptElement.getAttribute(WIDGET_SCRIPT_INSTANCE_ATTR)?.trim() ?? "";
    const widgetByInstanceId = persistedInstanceId
        ? mountedWidgetsByInstanceId.get(persistedInstanceId) ?? null
        : null;
    const existingWidget = mountedWidgetsByScript.get(scriptElement);
    const candidateWidget = widgetByInstanceId ?? existingWidget ?? null;

    if (!candidateWidget) {
        return null;
    }

    if (
        candidateWidget.scriptElement === scriptElement
        && candidateWidget.rootElement.isConnected
        && candidateWidget.instanceId === persistedInstanceId
    ) {
        mountedWidgetsByScript.set(scriptElement, candidateWidget);
        mountedWidgetsByInstanceId.set(candidateWidget.instanceId, candidateWidget);
        return candidateWidget;
    }

    mountedWidgetsByScript.delete(scriptElement);
    if (persistedInstanceId) {
        mountedWidgetsByInstanceId.delete(persistedInstanceId);
    }
    return null;
}

function getOrCreateWidgetRoot(scriptElement: HTMLScriptElement) {
    const existingRoot = scriptElement.parentElement;

    if (
        existingRoot instanceof HTMLElement
        && existingRoot.getAttribute(WIDGET_ROOT_ATTR) === "true"
    ) {
        return existingRoot;
    }

    const rootElement = document.createElement("div");
    const mountElement = document.createElement("div");

    rootElement.setAttribute(WIDGET_ROOT_ATTR, "true");
    mountElement.setAttribute(WIDGET_MOUNT_ATTR, "true");

    scriptElement.replaceWith(rootElement);
    scriptElement.style.display = "none";
    rootElement.append(scriptElement, mountElement);

    return rootElement;
}

function getWidgetMountElement(rootElement: HTMLElement) {
    const existingMountElement = rootElement.querySelector<HTMLElement>(`[${WIDGET_MOUNT_ATTR}="true"]`);

    if (existingMountElement) {
        return existingMountElement;
    }

    const mountElement = document.createElement("div");
    mountElement.setAttribute(WIDGET_MOUNT_ATTR, "true");
    rootElement.append(mountElement);
    return mountElement;
}

function isMountedWidgetTarget(value: unknown): value is BootstrappedOffreWidget {
    return isPlainObject(value)
        && value.scriptElement instanceof HTMLScriptElement
        && typeof value.unmount === "function";
}

function resolveScriptElement(target: UnmountTarget) {
    return target instanceof HTMLScriptElement ? target : target.scriptElement;
}

function markScriptAsMounted(scriptElement: HTMLScriptElement, instanceId: string) {
    scriptElement.setAttribute(WIDGET_SCRIPT_MOUNTED_ATTR, "true");
    scriptElement.setAttribute(WIDGET_SCRIPT_INSTANCE_ATTR, instanceId);
}

function markRootAsMounted(rootElement: HTMLElement, instanceId: string) {
    rootElement.setAttribute(WIDGET_ROOT_INSTANCE_ATTR, instanceId);
}

function clearMountedScriptMarker(scriptElement: HTMLScriptElement) {
    scriptElement.removeAttribute(WIDGET_SCRIPT_MOUNTED_ATTR);
    scriptElement.removeAttribute(WIDGET_SCRIPT_INSTANCE_ATTR);
}

function cleanupMountedWidget(
    scriptElement: HTMLScriptElement,
    mountedWidget: BootstrappedOffreWidget,
) {
    const mountedWidgetsByInstanceId = getMountedWidgetsByInstanceId();
    mountedWidget.app.unmount();
    mountedWidget.queryClient.clear();
    scriptElement.style.display = "";
    mountedWidget.rootElement.replaceWith(scriptElement);
    mountedWidgetsByScript.delete(scriptElement);
    mountedWidgetsByInstanceId.delete(mountedWidget.instanceId);
    clearMountedScriptMarker(scriptElement);
}

function describeScriptElement(scriptElement: HTMLScriptElement, index: number) {
    return {
        index,
        mounted: scriptElement.getAttribute(WIDGET_SCRIPT_MOUNTED_ATTR) === "true",
        instanceId: scriptElement.getAttribute(WIDGET_SCRIPT_INSTANCE_ATTR) ?? "",
        textLength: scriptElement.textContent?.length ?? 0,
        parentTag: scriptElement.parentElement?.tagName?.toLowerCase() ?? ""
    };
}

function getWidgetScripts(root: ParentNode) {
    return Array.from(root.querySelectorAll<HTMLScriptElement>(WIDGET_SELECTOR));
}

export function mountOffreWidgetFromScript(
    scriptElement: HTMLScriptElement,
): BootstrappedOffreWidget | null {
    const existingWidget = getExistingMountedWidget(scriptElement);

    if (existingWidget) {
        logWidgetDebug("reuse mounted widget", {
            instanceId: existingWidget.instanceId,
            scriptMountedAttr: scriptElement.getAttribute(WIDGET_SCRIPT_MOUNTED_ATTR) === "true"
        });
        return existingWidget;
    }

    const payload = parseWidgetPayload(scriptElement);

    if (!payload) {
        return null;
    }

    const rootElement = getOrCreateWidgetRoot(scriptElement);
    const mountElement = getWidgetMountElement(rootElement);

    try {
        const mountedWidget = mountOffreWidget({container: mountElement, payload});
        const mountedWidgetsByInstanceId = getMountedWidgetsByInstanceId();
        const bootstrappedWidget: BootstrappedOffreWidget = {
            ...mountedWidget,
            payload,
            rootElement,
            scriptElement,
            unmount: () => unmountOffreWidget(scriptElement)
        };

        mountedWidgetsByScript.set(scriptElement, bootstrappedWidget);
        mountedWidgetsByInstanceId.set(bootstrappedWidget.instanceId, bootstrappedWidget);
        markScriptAsMounted(scriptElement, bootstrappedWidget.instanceId);
        markRootAsMounted(rootElement, bootstrappedWidget.instanceId);
        logWidgetDebug("mount widget", {
            instanceId: bootstrappedWidget.instanceId,
            hotelCount: Array.isArray(payload.hotels) ? payload.hotels.length : 0,
            scriptMountedAttr: true
        });

        return bootstrappedWidget;
    } catch (error) {
        rootElement.remove();
        errorWidget("failed to mount widget", error);
        return null;
    }
}

export function bootstrapOffreWidgets(root: ParentNode = document): BootstrappedOffreWidget[] {
    const widgetScripts = getWidgetScripts(root);

    logWidgetDebug("bootstrap widgets", {
        scriptCount: widgetScripts.length,
        scripts: widgetScripts.map((scriptElement, index) => describeScriptElement(scriptElement, index))
    });

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

    cleanupMountedWidget(scriptElement, mountedWidget);
    logWidgetDebug("unmount widget", {
        instanceId: mountedWidget.instanceId
    });

    return true;
}

export function unmountOffreWidgets(root: ParentNode = document): number {
    const widgetScripts = getWidgetScripts(root);

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

function registerWindowApi() {
    window.OffreWidget ||= {};
    window.OffreWidget.bootstrap = bootstrapOffreWidgets;
    window.OffreWidget.mount = mountOffreWidgetFromScript;
    window.OffreWidget.unmount = unmountWindowTarget;
}

if (typeof window !== "undefined") {
    registerWindowApi();
}
