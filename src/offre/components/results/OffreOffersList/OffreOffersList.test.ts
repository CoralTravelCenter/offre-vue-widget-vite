// @vitest-environment jsdom

import { createApp } from "vue";
import { afterEach, describe, expect, it, vi } from "vitest";
import OffreOffersList from "@/offre/components/results/OffreOffersList/OffreOffersList.vue";

const listMocks = vi.hoisted(() => ({
  normalizedProducts: {
    __v_isRef: true as const,
    value: [
      { key: "101", hotelId: "101", product: {}, hotelRuntimeEntry: null, tourType: "package" },
      { key: "202", hotelId: "202", product: {}, hotelRuntimeEntry: null, tourType: "package" }
    ]
  }
}));

vi.mock("@/offre/composables/useOffreOffersListState", () => ({
  useOffreOffersListState: () => listMocks
}));

vi.mock("@/lib/offre-performance", () => ({
  OFFRE_PERFORMANCE_MARKS: {
    firstCardRendered: "first-card-rendered",
    firstImageLoaded: "first-image-loaded"
  },
  markOffrePerformance: vi.fn()
}));

vi.mock("@/offre/components/results/OffreOfferCard/OffreOfferCard.vue", () => ({
  default: {
    props: {
      priorityImage: Boolean
    },
    template: "<div class='offer-card-stub' :data-priority-image='String(priorityImage)' />"
  }
}));

const mountedApps: Array<ReturnType<typeof createApp>> = [];

describe("OffreOffersList image priority", () => {
  afterEach(() => {
    for (const app of mountedApps.splice(0)) {
      app.unmount();
    }
    document.body.replaceChildren();
  });

  it("prioritizes only the first rendered card", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const app = createApp(OffreOffersList, {
      instanceId: "test-widget",
      products: [],
      productReference: {},
      searchOptions: {},
      hotelRuntimeById: new Map(),
      tourTypeByHotelId: {},
      brandKey: "coral"
    });

    mountedApps.push(app);
    app.mount(host);

    const cards = [...host.querySelectorAll(".offer-card-stub")];
    expect(cards.map((card) => card.getAttribute("data-priority-image"))).toEqual(["true", "false"]);
  });
});
