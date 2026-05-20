import { getDevOffrePayload } from "@/dev/offre-payloads";
import type { BrandKey } from "@/brands/types";
import { bootstrapOffreWidgets } from "@/widget/entry";

const DEV_WIDGETS_ROOT_ID = "offre-dev-widgets";

function getRequestedBrands() {
  if (typeof window === "undefined") {
    return ["coral"] as BrandKey[];
  }

  const searchParams = new URLSearchParams(window.location.search);
  const brandsParam = searchParams.get("brands")?.trim();

  if (!brandsParam) {
    return ["coral"] as BrandKey[];
  }

  const brands = brandsParam
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry): entry is BrandKey => entry === "coral" || entry === "sunmar");

  return brands.length ? brands : ["coral"];
}

function ensureDevSlots() {
  const widgetsRoot = document.getElementById(DEV_WIDGETS_ROOT_ID);

  if (!widgetsRoot) {
    return;
  }

  const requestedBrands = getRequestedBrands();

  widgetsRoot.replaceChildren();

  for (const brandKey of requestedBrands) {
    const slot = document.createElement("div");
    slot.className = "dev-widget-slot";
    slot.dataset.offreDevSlot = brandKey;
    widgetsRoot.append(slot);
  }
}

function ensureDevPayloadSlots() {
  const slots = Array.from(document.querySelectorAll<HTMLElement>("[data-offre-dev-slot]"));

  for (const slot of slots) {
    if (slot.querySelector("script[data-offre-vue-test]")) {
      continue;
    }

    const brandKey = slot.dataset.offreDevSlot === "sunmar" ? "sunmar" : "coral";
    const script = document.createElement("script");

    script.type = "application/json";
    script.dataset.offreVueTest = "";
    script.textContent = JSON.stringify(getDevOffrePayload(brandKey));

    slot.append(script);
  }
}

ensureDevSlots();
ensureDevPayloadSlots();
bootstrapOffreWidgets();
