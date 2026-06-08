// @vitest-environment jsdom

import { createApp, nextTick } from "vue";
import { afterEach, describe, expect, it, vi } from "vitest";

const initYmapsMock = vi.hoisted(() => vi.fn(async () => undefined));

vi.mock("@vueuse/core", () => ({
	useMediaQuery: vi.fn(() => ({ value: false }))
}));

vi.mock("@/offre/composables/useOffreMapHotelOffers", () => ({
	useOffreMapHotelOffers: () => ({
		mapOfferMode: { value: "package" },
		hotelOffersByHotelId: { value: new Map() },
		loadingHotelIds: { value: new Set() },
		mapOfferLoading: { value: false }
	})
}));

vi.mock("@/offre/composables/useOffreMapLocation", () => ({
	useOffreMapLocation: () => ({})
}));

vi.mock("@/offre/composables/useOffreMapSelection", () => ({
	useOffreMapSelection: () => ({
		activeHotelId: { value: null },
		activeMapPoint: { value: null },
		handleMarkerToggle: vi.fn(),
		closeOverlay: vi.fn(),
		selectPoint: vi.fn()
	})
}));

vi.mock("@/offre/composables/useOffreMapViewState", () => ({
	useOffreMapViewState: () => ({
		visibleMapPointsByHotelId: { value: new Map() },
		searchFilteredMapPoints: { value: [] },
		searchFilteredMapPointsByHotelId: { value: new Map() },
		searchFilteredHotelIds: { value: new Set() },
		activeMapOverlayModel: { value: null },
		overlayBounds: { value: null },
		hasBaseMapPoints: { value: true }
	})
}));

vi.mock("vue-yandex-maps", () => ({
	createYmapsOptions: vi.fn(),
	initYmaps: initYmapsMock,
	YandexMap: { name: "YandexMapStub", template: "<div data-testid='ymap'><slot /></div>" },
	YandexMapClusterer: { name: "YandexMapClustererStub", template: "<div><slot /><slot name='cluster' :length='0' :clusterer='{ features: [] }' /></div>" },
	YandexMapControls: { name: "YandexMapControlsStub", template: "<div><slot /></div>" },
	YandexMapDefaultFeaturesLayer: { name: "YandexMapDefaultFeaturesLayerStub", template: "<div></div>" },
	YandexMapDefaultSchemeLayer: { name: "YandexMapDefaultSchemeLayerStub", template: "<div></div>" },
	YandexMapMarker: { name: "YandexMapMarkerStub", template: "<div><slot /></div>" },
	YandexMapOverlay: { name: "YandexMapOverlayStub", template: "<div><slot /></div>" },
	YandexMapZoomControl: { name: "YandexMapZoomControlStub", template: "<div></div>" }
}));

vi.mock("@/offre/components/results/OffreMapClusterBadge/OffreMapClusterBadge.vue", () => ({
	default: { name: "OffreMapClusterBadgeStub", template: "<div></div>" }
}));

vi.mock("@/offre/components/results/OffreMapMarker/OffreMapMarker.vue", () => ({
	default: { name: "OffreMapMarkerStub", template: "<div></div>" }
}));

vi.mock("@/offre/components/results/OffreMapOverlayCard/OffreMapOverlayCard.vue", () => ({
	default: { name: "OffreMapOverlayCardStub", template: "<div></div>" }
}));

vi.mock("@/offre/components/results/OffreMapSidebar/OffreMapSidebar.vue", () => ({
	default: { name: "OffreMapSidebarStub", template: "<div></div>" }
}));

async function mountView() {
	vi.stubEnv("VITE_YMAPS_API_KEY", "test-key");
	vi.resetModules();
	const { default: OffreMapView } = await import("./OffreMapView.vue");
	const host = document.createElement("div");
	document.body.appendChild(host);

	const app = createApp(OffreMapView, {
		visibleProducts: [],
		searchOptions: {
			groupBy: "regions",
			chartersOnly: false,
			pricing: "default",
			theme: "default",
			timeframe: { fluid: ["P14D", "P115D"], monthly: true },
			nights: [7],
			regionsOrder: [],
			sortBy: "price"
		},
		productReference: {},
		selectedDepartureName: ""
	});

	app.mount(host);
	await nextTick();
	await Promise.resolve();

	return {
		host,
		unmount() {
			app.unmount();
			host.remove();
		}
	};
}

describe("OffreMapView", () => {
	afterEach(() => {
		document.body.innerHTML = "";
		vi.unstubAllEnvs();
		vi.restoreAllMocks();
		initYmapsMock.mockReset();
	});

	it("shows an error state when Yandex Maps initialization fails", async () => {
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
		initYmapsMock.mockRejectedValueOnce(new Error("network error"));

		const view = await mountView();

		expect(view.host.textContent).toContain("Не удалось загрузить карту");
		expect(errorSpy).toHaveBeenCalled();

		view.unmount();
	});
});
