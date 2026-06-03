// @vitest-environment jsdom

import { createApp, nextTick } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NormalizedOffreWidgetOptions, NormalizedWidgetHotelDescriptor } from "@/offre/lib/payload";

const mocks = vi.hoisted(() => {
  function manualRef<T>(initial: T) {
    let current = initial;

    return {
      __v_isRef: true as const,
      get value() {
        return current;
      },
      set value(next: T) {
        current = next;
      }
    };
  }

  const activeRegionId = manualRef("region-a");
  const departures = manualRef([{ id: "msk", type: 5, label: "Москва" }]);
  const departuresPending = manualRef(false);
  const hotelInfoById = manualRef(new Map());
  const matchedHotelsDirectory = manualRef([{ id: "101" }]);
  const options = manualRef({
    groupBy: "regions",
    chartersOnly: false,
    pricing: "default",
    theme: "default",
    timeframe: { fluid: ["P14D", "P115D"], monthly: true },
    nights: [7],
    regionsOrder: [],
    sortBy: "price"
  });
  const regionTabs = manualRef([{ id: "region-a", label: "Region A" }]);
  const regionsLoading = manualRef(false);
  const selectedDeparture = manualRef({ id: "msk", type: 5, name: "Москва" });
  const selectedDepartureId = manualRef("msk");
  const selectedTimeframe = manualRef("June");
  const timeframeOptions = manualRef([{ value: "June", label: "June" }]);
  const defaultGuests = manualRef({ adultsCount: 2, childrenAges: [] });
  const selectedGuests = manualRef({ adultsCount: 2, childrenAges: [] });
  const effectiveSearchOptions = manualRef(options.value);
  const guestsFilterKey = manualRef("{}");
  const currentPage = manualRef(1);
  const noMatchedProducts = manualRef(false);
  const productsPartial = manualRef(false);
  const productsError = manualRef(false);
  const productsFetching = manualRef(false);
  const productsInitialLoading = manualRef(false);
  const productsList = manualRef<Array<{ hotel: { id: string } }>>([]);
  const productsRefetching = manualRef(false);
  const productReference = manualRef<Record<string, unknown>>({});
  const queriedHotelIds = manualRef<string[]>([]);
  const requestState = manualRef("idle");
  const regionProductsSource = manualRef<Array<{ hotel: { id: string } }>>([]);
  const mapProductsSource = manualRef<Array<{ hotel: { id: string } }>>([]);
  const productReferenceSource = manualRef<Record<string, unknown>>({});
  const effectiveRequestState = manualRef("idle");
  const effectiveProductsError = manualRef(false);
  const effectiveNoMatchedProducts = manualRef(false);
  const shouldFetchRegionProducts = manualRef(false);
  const totalProducts = manualRef(0);
  const hasPagination = manualRef(false);
  const canLoadMore = manualRef(false);
  const paginatedProducts = manualRef<Array<{ hotel: { id: string } }>>([]);
  const tourTypeByHotelId = manualRef<Record<string, unknown>>({});
  const loadMoreIssueMessage = manualRef("");
  const loadMoreSkeletonItems = manualRef(0);
  const remainingProductsCount = manualRef(0);
  const nextLoadCount = manualRef(0);
  const loadMoreButtonLabel = manualRef("Показать ещё");
  const navigationFixedOptions = manualRef({
    top: 16,
    zIndex: 30,
    onStick: () => undefined
  });
  const navigationFloating = manualRef(false);
  const hasActivatedMapView = manualRef(false);
  const mapViewKey = manualRef("region-a|msk|June|{}");
  const hasEnteredViewport = manualRef(true);
  const productsListState = manualRef({
    title: "",
    description: "",
    modifierClass: "",
    partialMessage: "",
    showRetry: false
  });
  const mapProductsState = manualRef({
    title: "",
    description: "",
    modifierClass: "",
    partialMessage: "",
    showRetry: false
  });
  const showRegionSkeleton = manualRef(false);
  const showMapSkeleton = manualRef(false);

  return {
    manualRef,
    activeRegionId,
    departures,
    departuresPending,
    hotelInfoById,
    matchedHotelsDirectory,
    options,
    regionTabs,
    regionsLoading,
    selectedDeparture,
    selectedDepartureId,
    selectedTimeframe,
    timeframeOptions,
    defaultGuests,
    selectedGuests,
    effectiveSearchOptions,
    guestsFilterKey,
    currentPage,
    noMatchedProducts,
    productsPartial,
    productsError,
    productsFetching,
    productsInitialLoading,
    productsList,
    productsRefetching,
    productReference,
    queriedHotelIds,
    requestState,
    regionProductsSource,
    mapProductsSource,
    productReferenceSource,
    effectiveRequestState,
    effectiveProductsError,
    effectiveNoMatchedProducts,
    shouldFetchRegionProducts,
    totalProducts,
    hasPagination,
    canLoadMore,
    paginatedProducts,
    tourTypeByHotelId,
    loadMoreIssueMessage,
    loadMoreSkeletonItems,
    remainingProductsCount,
    nextLoadCount,
    loadMoreButtonLabel,
    navigationFixedOptions,
    navigationFloating,
    hasActivatedMapView,
    mapViewKey,
    hasEnteredViewport,
    productsListState,
    mapProductsState,
    showRegionSkeleton,
    showMapSkeleton,
    setActiveRegion: vi.fn(),
    handleGuestsApply: vi.fn(),
    handleGuestsReset: vi.fn(),
    setSelectedDepartureId: vi.fn(),
    setSelectedTimeframe: vi.fn(),
    setHotelTourType: vi.fn(),
    handleLoadMore: vi.fn()
  };
});

vi.mock("@/offre/composables/useOffreFiltersQueryState", () => ({
  useOffreFiltersQueryState: () => ({
    activeRegionId: mocks.activeRegionId,
    departures: mocks.departures,
    departuresQuery: { isPending: mocks.departuresPending },
    hotelInfoById: mocks.hotelInfoById,
    matchedHotelsDirectory: mocks.matchedHotelsDirectory,
    options: mocks.options,
    regionTabs: mocks.regionTabs,
    regionsLoading: mocks.regionsLoading,
    selectedDeparture: mocks.selectedDeparture,
    selectedDepartureId: mocks.selectedDepartureId,
    selectedTimeframe: mocks.selectedTimeframe,
    timeframeOptions: mocks.timeframeOptions,
    setActiveRegion: mocks.setActiveRegion
  })
}));

vi.mock("@/offre/composables/useOffreWidgetSessionState", () => ({
  useOffreWidgetSessionState: () => ({
    guestsPersistenceKey: mocks.manualRef("guests-key"),
    viewModePersistenceKey: mocks.manualRef("view-mode-key"),
    resetNonce: mocks.manualRef(0)
  })
}));

vi.mock("@/offre/composables/useOffreWidgetVisibilityState", () => ({
  useOffreWidgetVisibilityState: () => ({
    hasEnteredViewport: mocks.hasEnteredViewport
  })
}));

vi.mock("@/offre/composables/useOffreWidgetUiState", () => ({
  useOffreWidgetUiState: () => ({
    defaultGuests: mocks.defaultGuests,
    selectedGuests: mocks.selectedGuests,
    selectedRoomCriterias: mocks.manualRef([]),
    effectiveSearchOptions: mocks.effectiveSearchOptions,
    guestsFilterKey: mocks.guestsFilterKey,
    handleGuestsApply: mocks.handleGuestsApply,
    handleGuestsReset: mocks.handleGuestsReset
  })
}));

vi.mock("@/offre/composables/useOffreRegionPagingState", () => ({
  useOffreRegionPagingState: () => ({
    currentPage: mocks.currentPage
  })
}));

vi.mock("@/offre/composables/useOffreProductsQuery", () => ({
  useOffreProductsQuery: () => ({
    productsQuery: {},
    refetchProducts: vi.fn(),
    queriedHotelIds: mocks.queriedHotelIds,
    productsList: mocks.productsList,
    productReference: mocks.productReference,
    productsInitialLoading: mocks.productsInitialLoading,
    requestState: mocks.requestState,
    noMatchedProducts: mocks.noMatchedProducts,
    productsPartial: mocks.productsPartial,
    productsError: mocks.productsError,
    productsFetching: mocks.productsFetching,
    productsRefetching: mocks.productsRefetching,
    productsLoading: mocks.manualRef(0)
  })
}));

vi.mock("@/offre/composables/useOffreProductsCacheState", () => ({
  useOffreProductsCacheState: () => ({
    regionProductsSource: mocks.regionProductsSource,
    mapProductsSource: mocks.mapProductsSource,
    productReferenceSource: mocks.productReferenceSource,
    effectiveRequestState: mocks.effectiveRequestState,
    effectiveProductsError: mocks.effectiveProductsError,
    effectiveNoMatchedProducts: mocks.effectiveNoMatchedProducts,
    shouldFetchRegionProducts: mocks.shouldFetchRegionProducts,
    hasBootstrappedActiveRegion: mocks.manualRef(false)
  })
}));

vi.mock("@/offre/composables/useOffreWidgetListState", () => ({
  useOffreWidgetListState: () => ({
    viewMode: mocks.manualRef("list"),
    currentPage: mocks.currentPage,
    totalProducts: mocks.totalProducts,
    totalPages: mocks.manualRef(1),
    hasPagination: mocks.hasPagination,
    canLoadMore: mocks.canLoadMore,
    paginatedProducts: mocks.paginatedProducts,
    tourTypeByHotelId: mocks.tourTypeByHotelId,
    setHotelTourType: mocks.setHotelTourType
  })
}));

vi.mock("@/offre/composables/useOffreLoadMoreState", () => ({
  useOffreLoadMoreState: () => ({
    loadMoreIssueMessage: mocks.loadMoreIssueMessage,
    loadMoreSkeletonItems: mocks.loadMoreSkeletonItems,
    remainingProductsCount: mocks.remainingProductsCount,
    nextLoadCount: mocks.nextLoadCount,
    loadMoreButtonLabel: mocks.loadMoreButtonLabel,
    handleLoadMore: mocks.handleLoadMore
  })
}));

vi.mock("@/offre/composables/useOffreWidgetLayoutState", () => ({
  useOffreWidgetLayoutState: () => ({
    navigationFixedOptions: mocks.navigationFixedOptions,
    navigationFloating: mocks.navigationFloating,
    hasActivatedMapView: mocks.hasActivatedMapView,
    mapViewKey: mocks.mapViewKey
  })
}));

vi.mock("@/offre/composables/useOffreWidgetResultsState", () => ({
  useOffreWidgetResultsState: () => ({
    productsListState: mocks.productsListState,
    mapProductsState: mocks.mapProductsState,
    showRegionSkeleton: mocks.showRegionSkeleton,
    showMapSkeleton: mocks.showMapSkeleton
  })
}));

vi.mock("lucide-vue-next", () => ({
  LoaderCircle: {
    name: "LoaderCircle",
    template: "<span data-testid='loader-circle'></span>"
  }
}));

vi.mock("@/offre/components/OffreControls/OffreControls.vue", () => ({
  default: {
    name: "OffreControlsStub",
    template: "<div data-testid='offre-controls'></div>"
  }
}));

vi.mock("@/offre/components/ViewModeSwitch/ViewModeSwitch.vue", () => ({
  default: {
    name: "ViewModeSwitchStub",
    props: ["modelValue"],
    emits: ["update:modelValue"],
    template: "<button data-testid='view-mode-switch' @click=\"$emit('update:modelValue', 'map')\">switch</button>"
  }
}));

vi.mock("@/offre/components/RegionTabsNav/RegionTabsNav.vue", () => ({
  default: {
    name: "RegionTabsNavStub",
    template: "<div data-testid='region-tabs'></div>"
  }
}));

vi.mock("@/offre/components/results/OffreOffersList/OffreOffersList.vue", () => ({
  default: {
    name: "OffreOffersListStub",
    template: "<div data-testid='offers-list'>offers</div>"
  }
}));

vi.mock("@/offre/components/results/OffreOffersListSkeleton/OffreOffersListSkeleton.vue", () => ({
  default: {
    name: "OffreOffersListSkeletonStub",
    template: "<div data-testid='offers-list-skeleton'>skeleton</div>"
  }
}));

vi.mock("@/offre/components/results/OffreMapViewSkeleton/OffreMapViewSkeleton.vue", () => ({
  default: {
    name: "OffreMapViewSkeletonStub",
    template: "<div data-testid='map-view-skeleton'>map-skeleton</div>"
  }
}));

vi.mock("@/offre/components/results/OffreMapView/OffreMapView.vue", () => ({
  default: {
    name: "OffreMapViewStub",
    template: "<div data-testid='map-view'>map</div>"
  }
}));

vi.mock("@/offre/components/results/OffreResultsStateNotice/OffreResultsStateNotice.vue", () => ({
  default: {
    name: "OffreResultsStateNoticeStub",
    props: ["title", "description", "variant"],
    template: "<div data-testid='results-state-notice'>{{ title }}|{{ description }}|{{ variant }}</div>"
  }
}));

vi.mock("@/components/ui/button", () => ({
  Button: {
    name: "ButtonStub",
    emits: ["click"],
    template: "<button data-testid='load-more-button' @click=\"$emit('click')\"><slot /></button>"
  }
}));

async function mountRoot() {
  const { default: OffreWidgetRoot } = await import("./OffreWidgetRoot.vue");
  const container = document.createElement("div");
  document.body.appendChild(container);

  const app = createApp(OffreWidgetRoot, {
    instanceId: "widget-1",
    brandKey: "coral",
    brandDefinition: {
      key: "coral",
      title: "Coral Travel",
      themeClass: "offre-theme--coral",
      accentLabel: "Coral",
      description: "Brand"
    },
    options: {
      groupBy: "regions",
      chartersOnly: false,
      pricing: "default",
      theme: "default",
      timeframe: { fluid: ["P14D", "P115D"], monthly: true },
      nights: [7],
      regionsOrder: [],
      sortBy: "price"
    } satisfies NormalizedOffreWidgetOptions,
    hotelsList: [{
      id: "101",
      onlyhotel: false,
      usps: []
    }] satisfies NormalizedWidgetHotelDescriptor[]
  });
  app.directive("fixed", {});
  app.mount(container);
  await nextTick();

  return {
    container,
    unmount: () => {
      app.unmount();
      container.remove();
    }
  };
}

function resetState() {
  mocks.activeRegionId.value = "region-a";
  mocks.departuresPending.value = false;
  mocks.regionTabs.value = [{ id: "region-a", label: "Region A" }];
  mocks.regionsLoading.value = false;
  mocks.selectedDeparture.value = { id: "msk", type: 5, name: "Москва" };
  mocks.selectedDepartureId.value = "msk";
  mocks.selectedTimeframe.value = "June";
  mocks.defaultGuests.value = { adultsCount: 2, childrenAges: [] };
  mocks.selectedGuests.value = { adultsCount: 2, childrenAges: [] };
  mocks.guestsFilterKey.value = "{}";
  mocks.currentPage.value = 1;
  mocks.noMatchedProducts.value = false;
  mocks.productsPartial.value = false;
  mocks.productsError.value = false;
  mocks.productsFetching.value = false;
  mocks.productsInitialLoading.value = false;
  mocks.productsList.value = [];
  mocks.productsRefetching.value = false;
  mocks.productReference.value = {};
  mocks.queriedHotelIds.value = [];
  mocks.requestState.value = "idle";
  mocks.regionProductsSource.value = [];
  mocks.mapProductsSource.value = [];
  mocks.productReferenceSource.value = {};
  mocks.effectiveRequestState.value = "idle";
  mocks.effectiveProductsError.value = false;
  mocks.effectiveNoMatchedProducts.value = false;
  mocks.shouldFetchRegionProducts.value = false;
  mocks.totalProducts.value = 0;
  mocks.hasPagination.value = false;
  mocks.canLoadMore.value = false;
  mocks.paginatedProducts.value = [];
  mocks.tourTypeByHotelId.value = {};
  mocks.loadMoreIssueMessage.value = "";
  mocks.loadMoreSkeletonItems.value = 0;
  mocks.remainingProductsCount.value = 0;
  mocks.nextLoadCount.value = 0;
  mocks.loadMoreButtonLabel.value = "Показать ещё";
  mocks.navigationFloating.value = false;
  mocks.hasActivatedMapView.value = false;
  mocks.mapViewKey.value = "region-a|msk|June|{}";
  mocks.productsListState.value = {
    title: "",
    description: "",
    modifierClass: "",
    partialMessage: "",
    showRetry: false
  };
  mocks.mapProductsState.value = {
    title: "",
    description: "",
    modifierClass: "",
    partialMessage: "",
    showRetry: false
  };
  mocks.showRegionSkeleton.value = false;
  mocks.showMapSkeleton.value = false;
  mocks.setActiveRegion.mockReset();
  mocks.handleGuestsApply.mockReset();
  mocks.handleGuestsReset.mockReset();
  mocks.setSelectedDepartureId.mockReset();
  mocks.setSelectedTimeframe.mockReset();
  mocks.setHotelTourType.mockReset();
  mocks.handleLoadMore.mockReset();
}

describe("OffreWidgetRoot", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    resetState();
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  it("renders the list skeleton branch when region results are loading", async () => {
    mocks.showRegionSkeleton.value = true;
    mocks.shouldFetchRegionProducts.value = true;
    mocks.productsListState.value = {
      title: "",
      description: "",
      modifierClass: "offre-widget__state--loading",
      partialMessage: "",
      showRetry: false
    };

    const view = await mountRoot();

    expect(view.container.querySelector("[data-testid='offers-list-skeleton']")).toBeTruthy();
    expect(view.container.querySelector("[data-testid='offers-list']")).toBeFalsy();

    view.unmount();
  });

  it("renders the error notice branch when products failed and nothing is cached", async () => {
    mocks.effectiveProductsError.value = true;
    mocks.productsListState.value = {
      title: "Упс! Что-то пошло не так.",
      description: "Но мы это исправим, попробуйте зайти позже",
      modifierClass: "offre-widget__state--error",
      partialMessage: "",
      showRetry: false
    };

    const view = await mountRoot();
    const notice = view.container.querySelector("[data-testid='results-state-notice']");

    expect(notice?.textContent).toContain("Упс! Что-то пошло не так.");
    expect(notice?.textContent).toContain("error");

    view.unmount();
  });

  it("renders list results and forwards load-more clicks", async () => {
    mocks.regionProductsSource.value = [{ hotel: { id: "101" } }];
    mocks.paginatedProducts.value = [{ hotel: { id: "101" } }];
    mocks.totalProducts.value = 8;
    mocks.hasPagination.value = true;
    mocks.canLoadMore.value = true;

    const view = await mountRoot();
    const loadMoreButton = view.container.querySelector("[data-testid='load-more-button']") as HTMLButtonElement | null;

    expect(view.container.querySelector("[data-testid='offers-list']")).toBeTruthy();
    expect(loadMoreButton).toBeTruthy();

    loadMoreButton?.click();
    await nextTick();

    expect(mocks.handleLoadMore).toHaveBeenCalledTimes(1);
    view.unmount();
  });
});
