import { getDevOffrePayload } from "dev/fixtures/offre-payloads";
import { bootstrapOffreWidgets } from "widget/entry";

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

ensureDevPayloadSlots();
bootstrapOffreWidgets();
