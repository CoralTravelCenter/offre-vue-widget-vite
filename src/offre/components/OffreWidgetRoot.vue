<script setup lang="ts">
import {useMediaQuery} from "@vueuse/core";
import {ChevronLeftIcon, ChevronRightIcon} from "lucide-vue-next";
import {computed, ref, watch} from "vue";
import OffreControls from "offre/components/controls/OffreControls.vue";
import ViewModeSwitch from "offre/components/controls/ViewModeSwitch.vue";
import RegionTabsNav from "offre/components/RegionTabsNav.vue";
import OffreOffersList from "offre/components/results/OffreOffersList.vue";
import OffreOffersListSkeleton from "offre/components/results/OffreOffersListSkeleton.vue";
import OffreMapViewSkeleton from "offre/components/results/OffreMapViewSkeleton.vue";
import OffreMapView from "offre/components/results/OffreMapView.vue";
import {useOffreFiltersQueryState} from "offre/composables/useOffreFiltersQueryState";
import {useOffreProductsQuery} from "offre/composables/useOffreProductsQuery";
import {useOffreWidgetUiState} from "offre/composables/useOffreWidgetUiState";
import {useOffreWidgetListState} from "offre/composables/useOffreWidgetListState";
import {getWidgetHotelId} from "offre/lib/payload";
import {stableStringify} from "shared/lib/stable-stringify";
import type {OffreWidgetRootProps} from "shared/types/widget";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationNext,
  PaginationPrevious
} from "ui/pagination";

const DESKTOP_LAYOUT_BREAKPOINT = "(min-width: 1024px)";
const TABLET_LAYOUT_BREAKPOINT = "(min-width: 768px)";
const STICKY_BOTTOM_OFFSET = 16;
const CONTROLS_STICKY_Z_INDEX = 30;
const MV_MODE_TOP_OFFSET = 76;
const DESKTOP_TOP_OFFSET = 16;
const TABLET_TOP_OFFSET = 57;
const MOBILE_TOP_OFFSET = 74;
const PAGINATION_DESKTOP_BREAKPOINT = "(min-width: 768px)";
const PRODUCTS_PAGE_SIZE = 5;

const props = withDefaults(defineProps<OffreWidgetRootProps>(), {
  options: () => ({}),
  hotelsList: () => []
});

const {
  activeRegionId,
  departures,
  departuresQuery,
  hotelInfoById,
  matchedHotelsDirectory,
  options,
  regionTabs,
  regionsLoading,
  selectedDeparture,
  selectedDepartureId,
  selectedTimeframe,
  timeframeOptions,
  setActiveRegion
} = useOffreFiltersQueryState(
    () => props.options,
    () => props.hotelsList
);
const hotelOrderById = computed(() => {
  return props.hotelsList.reduce<Map<string, number>>((accumulator, hotelEntry, index) => {
    const hotelId = getWidgetHotelId(hotelEntry);

    if (hotelId !== null && hotelId !== undefined && !accumulator.has(String(hotelId))) {
      accumulator.set(String(hotelId), index);
    }

    return accumulator;
  }, new Map<string, number>());
});
const guestsPersistenceKey = computed(() => {
  return stableStringify({
    brandKey: props.brandKey,
    hotels: props.hotelsList.map((hotelEntry) => getWidgetHotelId(hotelEntry)),
    options: props.options
  });
});
const viewModePersistenceKey = computed(() => {
  return stableStringify({
    brandKey: props.brandKey,
    hotels: props.hotelsList.map((hotelEntry) => getWidgetHotelId(hotelEntry)),
    options: props.options,
    mode: "results-view"
  });
});

const {
  selectedGuests,
  effectiveSearchOptions,
  guestsFilterKey,
  handleGuestsApply,
  handleGuestsReset
} = useOffreWidgetUiState({
  optionsSource: options,
  storageKeySource: guestsPersistenceKey
});

const {
  noMatchedProducts,
  productsError,
  productsList,
  productReference,
  requestState
} = useOffreProductsQuery({
  optionsSource: effectiveSearchOptions,
  hotelsSource: matchedHotelsDirectory,
  hotelInfoByIdSource: hotelInfoById,
  selectedTimeframeSource: selectedTimeframe,
  selectedDepartureSource: selectedDeparture,
  hotelOrderByIdSource: hotelOrderById
});

const isMvMode = computed(() => {
  if (typeof window === "undefined") {
    return false;
  }

  return new URLSearchParams(window.location.search).get("mv") === "true";
});

const isLargeScreen = useMediaQuery(DESKTOP_LAYOUT_BREAKPOINT);
const isTabletScreen = useMediaQuery(TABLET_LAYOUT_BREAKPOINT);
const isPaginationDesktop = useMediaQuery(PAGINATION_DESKTOP_BREAKPOINT);

function resolveNavigationTopOffset() {
  if (isMvMode.value) {
    return MV_MODE_TOP_OFFSET;
  }

  if (isLargeScreen.value) {
    return DESKTOP_TOP_OFFSET;
  }

  if (isTabletScreen.value) {
    return TABLET_TOP_OFFSET;
  }

  return MOBILE_TOP_OFFSET;
}

const navigationStickyOptions = computed(() => ({
  top: resolveNavigationTopOffset(),
  side: "top",
  zIndex: CONTROLS_STICKY_Z_INDEX
}));

const departuresLoading = computed(() => departuresQuery.isPending.value);
const paginationSiblingCount = computed(() => {
  return isPaginationDesktop.value ? 1 : 0;
});
const paginationShowEdges = computed(() => true);
const hasActivatedMapView = ref(false);
const hotelRuntimeById = computed(() => {
  return matchedHotelsDirectory.value.reduce<Map<string, typeof matchedHotelsDirectory.value[number]>>((accumulator, hotel) => {
    accumulator.set(String(hotel.id), hotel);
    return accumulator;
  }, new Map<string, typeof matchedHotelsDirectory.value[number]>());
});

const {
  viewMode,
  currentPage,
  totalProducts,
  hasPagination,
  paginatedProducts,
  tourTypeByHotelId,
  setHotelTourType
} = useOffreWidgetListState({
  productsSource: productsList,
  activeRegionIdSource: activeRegionId,
  selectedDepartureIdSource: selectedDepartureId,
  selectedTimeframeSource: selectedTimeframe,
  guestsFilterKeySource: guestsFilterKey,
  storageKeySource: viewModePersistenceKey,
  pageSize: PRODUCTS_PAGE_SIZE
});

watch(viewMode, (nextValue) => {
  if (nextValue === "map") {
    hasActivatedMapView.value = true;
  }
}, { immediate: true });

const mapViewKey = computed(() => {
  return [
    activeRegionId.value ?? "",
    selectedDepartureId.value ?? "",
    selectedTimeframe.value ?? "",
    guestsFilterKey.value
  ].join("|");
});
</script>

<template>
  <div class="offre-widget">
    <div
        v-sticky="navigationStickyOptions"
        class="offre-widget__navigation bg-brand-card py-2"
    >
      <RegionTabsNav
          :model-value="activeRegionId"
          :isLoading="regionsLoading"
          :tabs="regionTabs"
          class="offre-widget__tabs"
          @update:model-value="setActiveRegion"
      />
      <OffreControls
          v-model:selected-departure-id="selectedDepartureId"
          v-model:selected-timeframe="selectedTimeframe"
          :adults-count="selectedGuests.adultsCount"
          :children-ages="selectedGuests.childrenAges"
          :departures="departures"
          :departures-loading="departuresLoading"
          :timeframe-options="timeframeOptions"
          :timeframes-loading="regionsLoading"
          @apply-guests="handleGuestsApply"
          @reset-guests="handleGuestsReset"
      />
      <ViewModeSwitch v-model="viewMode"/>
    </div>

    <div
        v-show="viewMode === 'list'"
        class="offre-widget__results offre-widget__results--list mt-4"
    >
      <div
          v-if="requestState === 'loading'"
          class="offre-widget__state offre-widget__state--loading"
      >
        <OffreOffersListSkeleton />
      </div>

      <div
          v-else-if="productsError"
          class="offre-widget__state offre-widget__state--error border border-brand-border bg-brand-card px-4 py-6 text-brand-destructive"
      >
        Ошибка загрузки туров
      </div>

      <div
          v-else-if="noMatchedProducts"
          class="offre-widget__state offre-widget__state--empty border border-brand-border bg-brand-card px-4 py-6 text-brand-muted-foreground"
      >
        По выбранным параметрам ничего не найдено
      </div>

      <template v-else-if="productsList.length > 0">
        <OffreOffersList
            :products="paginatedProducts"
            :product-reference="productReference"
            :selected-departure-name="selectedDeparture?.name ?? ''"
            :pricing-mode="effectiveSearchOptions.pricing"
            :search-options="effectiveSearchOptions"
            :brand-key="brandKey"
            :hotel-runtime-by-id="hotelRuntimeById"
            :tour-type-by-hotel-id="tourTypeByHotelId"
            @update-tour-type="setHotelTourType"
        />

        <Pagination
            v-if="hasPagination"
            class="offre-widget__pagination mt-6"
            v-model:page="currentPage"
            :items-per-page="PRODUCTS_PAGE_SIZE"
            :sibling-count="paginationSiblingCount"
            :total="totalProducts"
            :show-edges="paginationShowEdges"
        >
          <PaginationContent
              v-slot="{ items }"
              class="offre-widget__pagination-content gap-2"
          >
            <PaginationPrevious
                size="icon-lg"
                class="offre-widget__pagination-control size-10 rounded-lg border border-brand-border bg-brand-card p-0 text-brand-foreground"
            >
              <ChevronLeftIcon class="offre-widget__pagination-icon size-4"/>
            </PaginationPrevious>

            <template
                v-for="(item, index) in items"
                :key="item.type === 'page' ? item.value : `ellipsis-${index}`"
            >
              <PaginationItem
                  v-if="item.type === 'page'"
                  :is-active="item.value === currentPage"
                  size="icon-lg"
                  :value="item.value"
                  :class="item.value === currentPage
                  ? 'offre-widget__pagination-item size-10 rounded-lg border border-brand-primary bg-brand-primary p-0 text-brand-primary-foreground hover:bg-brand-primary hover:text-brand-primary-foreground'
                  : 'offre-widget__pagination-item size-10 rounded-lg border border-brand-border bg-brand-card p-0 text-brand-foreground'"
              >
                {{ item.value }}
              </PaginationItem>

              <PaginationEllipsis
                  v-else
                  class="offre-widget__pagination-ellipsis size-10 text-brand-foreground"
              />
            </template>

            <PaginationNext
                size="icon-lg"
                class="offre-widget__pagination-control size-10 rounded-lg border border-brand-border bg-brand-card p-0 text-brand-foreground"
            >
              <ChevronRightIcon class="offre-widget__pagination-icon size-4"/>
            </PaginationNext>
          </PaginationContent>
        </Pagination>
      </template>
    </div>

    <div
        v-if="hasActivatedMapView"
        v-show="viewMode === 'map'"
        class="offre-widget__results offre-widget__results--map mt-4"
    >
      <OffreMapViewSkeleton
          v-if="requestState === 'loading'"
      />

      <OffreMapView
          v-else
          :key="mapViewKey"
          :products="productsList"
          :pricing-mode="effectiveSearchOptions.pricing"
          :search-options="effectiveSearchOptions"
          :product-reference="productReference"
          :selected-departure-name="selectedDeparture?.name ?? ''"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.offre-widget,
.offre-widget__results {
  overflow: visible;
}

.offre-widget__results {
  margin-right: -16px;
  padding-right: 16px;
}

.offre-widget__results--map {
  margin-right: 0;
  padding-right: 0;
}

.offre-widget__navigation {
  background-color: var(--brand-card);
  border-radius: var(--brand-radius-chip);
  display: grid;
  grid-template-columns: 1fr min-content;
  gap: 8px;
  grid-auto-flow: row;
  grid-template-areas:
    "nav nav"
    "inputs switcher";
  transition: box-shadow 0.2s ease;
}

@media (min-width: 1024px) {
  .offre-widget__navigation {
    align-items: center;
    grid-template-columns: minmax(0, 1fr) auto auto;
    grid-template-areas: "nav inputs switcher";
  }
}

.offre-widget__navigation.sticked {
  box-shadow: var(--brand-shadow-widget);
}

.offre-widget__tabs {
  grid-area: nav;
}

.offre-widget__state {
  border-radius: var(--brand-radius-panel);
  font-size: var(--brand-text-body);
  line-height: var(--brand-leading-control);
}

.offre-widget__pagination {
  display: flex;
  justify-content: center;
}

.offre-widget__pagination-content {
  align-items: center;
}

.offre-widget__pagination-control,
.offre-widget__pagination-item {
  border-radius: var(--brand-radius-button);
}

.offre-widget__pagination-control:hover,
.offre-widget__pagination-item:not([data-selected]):hover {
  background-color: var(--brand-card);
  border-color: var(--brand-primary);
  color: var(--brand-primary);
}

</style>
