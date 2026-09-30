// @vitest-environment jsdom

import { createApp, nextTick } from "vue";
import { afterEach, describe, expect, it, vi } from "vitest";
import OffreOfferCard from "@/offre/components/results/OffreOfferCard/OffreOfferCard.vue";
import type { NormalizedOffreWidgetOptions } from "@/offre/lib/payload";

const hotelOfferMocks = vi.hoisted(() => {
  function manualRef<T>(initial: T) {
    return {
      __v_isRef: true as const,
      value: initial
    };
  }

  return {
    hotelOffer: manualRef(null),
    isPending: manualRef(false)
  };
});

vi.mock("@/offre/composables/useHotelOfferQuery", () => ({
  useHotelOfferQuery: () => ({
    hotelOffer: hotelOfferMocks.hotelOffer,
    hotelOfferQuery: {
      isPending: hotelOfferMocks.isPending
    }
  })
}));

vi.mock("@/offre/components/results/OffreOfferPricingPanel/OffreOfferPricingPanel.vue", () => ({
  default: { template: "<div />" }
}));

vi.mock("@/offre/components/results/OffreOfferTerms/OffreOfferTerms.vue", () => ({
  default: { template: "<div />" }
}));

const searchOptions: NormalizedOffreWidgetOptions = {
  groupBy: "regions",
  chartersOnly: false,
  pricing: "default",
  theme: "default",
  timeframe: { fluid: ["P14D", "P115D"], monthly: true },
  nights: [7],
  regionsOrder: [],
  sortBy: "price"
};

const mountedApps: Array<ReturnType<typeof createApp>> = [];

function mountCard(priorityImage = false) {
  const host = document.createElement("div");
  document.body.append(host);
  const app = createApp(OffreOfferCard, {
    product: {
      hotel: {
        id: 101,
        name: "Hotel Alpha",
        images: [{ sizes: [{ type: 4, url: "https://cdn.example/hotel.jpg" }] }]
      },
      offers: [{
        price: { amount: 100000 },
        rooms: [],
        link: { redirectionUrl: "/hotel-alpha" }
      }]
    },
    productReference: {},
    searchOptions,
    brandKey: "coral",
    priorityImage
  });

  mountedApps.push(app);
  app.mount(host);
  return host;
}

describe("OffreOfferCard image loading", () => {
  afterEach(() => {
    for (const app of mountedApps.splice(0)) {
      app.unmount();
    }
    document.body.replaceChildren();
  });

  it("prioritizes the lead card image", () => {
    const host = mountCard(true);
    const image = host.querySelector(".offre-offer-card__image");

    expect(image?.getAttribute("loading")).toBe("eager");
    expect(image?.getAttribute("decoding")).toBe("auto");
    expect(image?.getAttribute("fetchpriority")).toBe("high");
  });

  it("loads regular images lazily and replaces a failed image with the placeholder", async () => {
    const host = mountCard();
    const image = host.querySelector<HTMLImageElement>(".offre-offer-card__image");

    expect(image?.getAttribute("loading")).toBe("lazy");
    expect(image?.getAttribute("decoding")).toBe("async");
    expect(image?.hasAttribute("fetchpriority")).toBe(false);

    image?.dispatchEvent(new Event("error"));
    await nextTick();

    expect(host.querySelector(".offre-offer-card__image")).toBeNull();
    expect(host.querySelector(".offre-offer-card__image-placeholder")).not.toBeNull();
  });
});
