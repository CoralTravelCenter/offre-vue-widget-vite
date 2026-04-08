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

const {
  selectedGuests,
  effectiveSearchOptions,
  guestsFilterKey,
  handleGuestsApply,
  handleGuestsReset
} = useOffreWidgetUiState({
  optionsSource: options
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
  <div class="offre-widget-container">
    <div
        v-sticky="navigationStickyOptions"
        class="offre-widget-navigation bg-white py-2"
    >
      <RegionTabsNav
          :model-value="activeRegionId"
          :isLoading="regionsLoading"
          :tabs="regionTabs"
          class="offre-widget-navigation__tabs nav"
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
        class="offre-widget-results mt-4"
    >
      <div
          v-if="requestState === 'loading'"
          class="offre-widget-state offre-widget-state--loading"
      >
        <OffreOffersListSkeleton />
      </div>

      <div
          v-else-if="productsError"
          class="offre-widget-state offre-widget-state--error rounded-2xl border bg-white px-4 py-6 text-sm text-destructive"
      >
        Ошибка загрузки туров
      </div>

      <div
          v-else-if="noMatchedProducts"
          class="offre-widget-state offre-widget-state--empty rounded-2xl border bg-white px-4 py-6 text-sm text-muted-foreground"
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
            class="offre-widget-pagination mt-6"
            v-model:page="currentPage"
            :items-per-page="PRODUCTS_PAGE_SIZE"
            :sibling-count="paginationSiblingCount"
            :total="totalProducts"
            :show-edges="paginationShowEdges"
        >
          <PaginationContent
              v-slot="{ items }"
              class="offre-widget-pagination__content gap-2"
          >
            <PaginationPrevious
                size="icon-lg"
                class="offre-widget-pagination__control size-10 rounded-lg border border-border bg-card p-0 text-foreground"
            >
              <ChevronLeftIcon class="offre-widget-pagination__icon size-4"/>
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
                  ? 'offre-widget-pagination__item size-10 rounded-lg border border-primary bg-primary p-0 text-primary-foreground hover:bg-primary hover:text-primary-foreground'
                  : 'offre-widget-pagination__item size-10 rounded-lg border border-border bg-card p-0 text-foreground'"
              >
                {{ item.value }}
              </PaginationItem>

              <PaginationEllipsis
                  v-else
                  class="offre-widget-pagination__ellipsis size-10 text-foreground"
              />
            </template>

            <PaginationNext
                size="icon-lg"
                class="offre-widget-pagination__control size-10 rounded-lg border border-border bg-card p-0 text-foreground"
            >
              <ChevronRightIcon class="offre-widget-pagination__icon size-4"/>
            </PaginationNext>
          </PaginationContent>
        </Pagination>
      </template>
    </div>

    <div
        v-if="hasActivatedMapView"
        v-show="viewMode === 'map'"
        class="offre-widget-results mt-4"
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
.offre-widget-container,
.offre-widget-results {
  overflow: visible;
}

.offre-widget-results {
  margin-right: -16px;
  padding-right: 16px;
}

.offre-widget-navigation {
  background-color: #fff;
  border-radius: 16px;
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
  .offre-widget-navigation {
    align-items: center;
    grid-template-columns: minmax(0, 1fr) auto auto;
    grid-template-areas: "nav inputs switcher";
  }
}

.offre-widget-navigation.sticked {
  box-shadow: 0 0 14px rgba(0, 0, 0, 0.14);
}

.nav {
  grid-area: nav;
}

.offre-widget-pagination__control:hover,
.offre-widget-pagination__item:not([data-selected]):hover {
  background-color: #fff;
  border-color: rgb(74 158 212);
  color: rgb(74 158 212);
}

</style>
