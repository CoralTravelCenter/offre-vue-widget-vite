import type { BrandKey } from "shared/types/brand";
import type { WidgetPayload } from "shared/types/widget";
import { devOffrePayloads } from "dev/fixtures/offre-payloads";
import { hostReactAppReady } from "monkey/utils/host-react-app-ready";
import { bootstrapOffreWidgets } from "widget/entry";

const MONKEY_ROOT_ID = "monkey-app";
const MONKEY_WIDGET_WIDTH = "min(420px, calc(100vw - 32px))";
const MONKEY_READY_TIMEOUT_MS = 15_000;
const targetSelector = import.meta.env.VITE_MONKEY_TARGET?.trim() || "#__next > div";
const activeBrand: BrandKey =
  import.meta.env.VITE_MONKEY_BRAND === "sunmar" ? "sunmar" : "coral";

function ensureMonkeyRoot(hostElement: HTMLElement) {
  const existingRoot = document.getElementById(MONKEY_ROOT_ID);

  if (existingRoot) {
    return existingRoot;
  }

  const root = document.createElement("div");
  root.id = MONKEY_ROOT_ID;
  root.style.position = "fixed";
  root.style.right = "16px";
  root.style.bottom = "16px";
  root.style.zIndex = "2147483647";
  root.style.width = MONKEY_WIDGET_WIDTH;
  root.style.maxWidth = MONKEY_WIDGET_WIDTH;
  root.style.pointerEvents = "auto";

  hostElement.append(root);
  return root;
}

function ensureWidgetPayload(root: HTMLElement, payload: WidgetPayload) {
  if (root.querySelector('[data-offre-vue-monkey-slot="true"]')) {
    return;
  }

  const slot = document.createElement("div");
  slot.dataset.offreVueMonkeySlot = "true";
  const script = document.createElement("script");
  script.type = "application/json";
  script.dataset.offreVueTest = "";
  script.textContent = JSON.stringify(payload);

  slot.append(script);
  root.append(slot);
}

async function bootstrapMonkeyWidget() {
  const hostElement = await hostReactAppReady(targetSelector, {
    timeoutMs: MONKEY_READY_TIMEOUT_MS
  });
  const root = ensureMonkeyRoot(hostElement);
  ensureWidgetPayload(root, devOffrePayloads[activeBrand]);
  bootstrapOffreWidgets(root);
}

void bootstrapMonkeyWidget().catch((error: unknown) => {
  console.error("OffreWidget: unable to mount monkey widget", error);
});
