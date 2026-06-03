import type { BrandKey } from "@/brands/types";
import type { WidgetPayload } from "@/widget/types";
import { getDevOffrePayload } from "@/dev/offre-payloads";
import { hostReactAppReady } from "./host-react-app-ready";
import { bootstrapOffreWidgets } from "@/widget/entry";

const MONKEY_ROOT_ID = "monkey-app";
const MONKEY_WIDGET_WIDTH = "min(420px, calc(100vw - 32px))";
const MONKEY_PAGE_WIDTH = "min(1120px, calc(100vw - 32px))";
const MONKEY_TEST_SCREEN_HEIGHT = "100vh";
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
  root.style.zIndex = "2147483647";
  root.style.position = "relative";
  root.style.width = MONKEY_PAGE_WIDTH;
  root.style.maxWidth = MONKEY_PAGE_WIDTH;
  root.style.margin = "0 auto";
  root.style.padding = "24px 16px 120px";
  root.style.pointerEvents = "auto";

  hostElement.append(root);
  return root;
}

function ensureTestScreen(root: HTMLElement, placement: "top" | "bottom") {
  const existingScreen = root.querySelector<HTMLElement>(`[data-offre-vue-monkey-screen="${placement}"]`);

  if (existingScreen) {
    return existingScreen;
  }

  const screen = document.createElement("section");
  screen.dataset.offreVueMonkeyScreen = placement;
  screen.style.minHeight = MONKEY_TEST_SCREEN_HEIGHT;
  screen.style.marginBlock = "40px";
  screen.style.display = "grid";
  screen.style.placeItems = "center";
  screen.style.border = "1px dashed rgba(15, 23, 42, 0.18)";
  screen.style.borderRadius = "24px";
  screen.style.background = "rgba(255, 255, 255, 0.82)";
  screen.style.backdropFilter = "blur(6px)";
  screen.style.color = "#475569";
  screen.style.font = "600 16px/1.4 Inter, system-ui, sans-serif";
  screen.style.letterSpacing = "0.02em";
  screen.style.textAlign = "center";
  screen.style.padding = "24px";
  screen.textContent = placement === "top"
    ? "Test scroll screen above the widget"
    : "Test scroll screen below the widget";

  return screen;
}

function ensureWidgetMount(root: HTMLElement) {
  const existingScript = root.querySelector<HTMLScriptElement>('script[data-offre-vue-test]');

  if (existingScript) {
    return existingScript;
  }

  const script = document.createElement("script");
  script.type = "application/json";
  script.dataset.offreVueTest = "";

  root.replaceChildren(
    ensureTestScreen(root, "top"),
    script,
    ensureTestScreen(root, "bottom")
  );

  return script;
}

function ensureWidgetPayload(root: HTMLElement, payload: WidgetPayload) {
  const script = ensureWidgetMount(root);
  script.textContent = JSON.stringify(payload);
}

async function bootstrapMonkeyWidget() {
  const hostElement = await hostReactAppReady(targetSelector, {
    timeoutMs: MONKEY_READY_TIMEOUT_MS
  });
  const root = ensureMonkeyRoot(hostElement);
  ensureWidgetPayload(root, getDevOffrePayload(activeBrand));
  bootstrapOffreWidgets(root);
}

void bootstrapMonkeyWidget().catch((error: unknown) => {
  console.error("OffreWidget: unable to mount monkey widget", error);
});
