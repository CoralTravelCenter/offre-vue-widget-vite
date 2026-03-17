<script setup lang="ts">
import {useMediaQuery} from "@vueuse/core";
import {ChevronLeftIcon, ChevronRightIcon} from "lucide-vue-next";
import {computed, ref, watch} from "vue";
import OffreControls from "offre/components/controls/OffreControls.vue";
import ViewModeSwitch from "offre/components/controls/ViewModeSwitch.vue";
import RegionTabsNav from "offre/components/RegionTabsNav.vue";
import OffreOffersList from "offre/components/results/OffreOffersList.vue";
import {useOffreFiltersQueryState} from "offre/composables/useOffreFiltersQueryState";
import {useOffreProductsQuery} from "offre/composables/useOffreProductsQuery";
import {getWidgetHotelId} from "offre/lib/payload";
import type {OffreTourType, OffreViewMode} from "offre/types";
import type {OffreWidgetRootProps} from "shared/types/widget";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationNext,
  PaginationPrevious
} from "ui/pagination";

const DESKTOP_LAYOUT_BREAKPOINT = "(min-width: 993px)";
const STICKY_BOTTOM_OFFSET = 16;
const CONTROLS_STICKY_Z_INDEX = 30;
const MV_MODE_TOP_OFFSET = 76;
const DESKTOP_TOP_OFFSET = 16;
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
  noMatchedProducts,
  productsError,
  productsList,
  productReference,
  requestState
} = useOffreProductsQuery({
  optionsSource: options,
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
const isPaginationDesktop = useMediaQuery(PAGINATION_DESKTOP_BREAKPOINT);

const navigationStickyOptions = computed(() => ({
  top: isMvMode.value
      ? MV_MODE_TOP_OFFSET
      : isLargeScreen.value
          ? DESKTOP_TOP_OFFSET
          : MOBILE_TOP_OFFSET,
  bottom: STICKY_BOTTOM_OFFSET,
  side: "both",
  zIndex: CONTROLS_STICKY_Z_INDEX
}));

const departuresLoading = computed(() => departuresQuery.isPending.value);
const viewMode = ref<OffreViewMode>("list");
const tourTypeByHotelId = ref<Record<string, OffreTourType>>({});
const currentPage = ref(1);
const paginationSiblingCount = computed(() => {
  return isPaginationDesktop.value ? 1 : 0;
});
const paginationShowEdges = computed(() => true);
const totalProducts = computed(() => productsList.value.length);
const totalPages = computed(() => {
  return Math.max(1, Math.ceil(totalProducts.value / PRODUCTS_PAGE_SIZE));
});
const hasPagination = computed(() => totalProducts.value > PRODUCTS_PAGE_SIZE);
const paginatedProducts = computed(() => {
  const startIndex = (currentPage.value - 1) * PRODUCTS_PAGE_SIZE;
  return productsList.value.slice(startIndex, startIndex + PRODUCTS_PAGE_SIZE);
});
const hotelRuntimeById = computed(() => {
  return matchedHotelsDirectory.value.reduce<Map<string, typeof matchedHotelsDirectory.value[number]>>((accumulator, hotel) => {
    accumulator.set(String(hotel.id), hotel);
    return accumulator;
  }, new Map<string, typeof matchedHotelsDirectory.value[number]>());
});

watch(productsList, (nextProducts) => {
  const knownHotelIds = new Set(nextProducts.map((product) => String(product.hotel?.id ?? "")));

  for (const hotelId of Object.keys(tourTypeByHotelId.value)) {
    if (!knownHotelIds.has(hotelId)) {
      delete tourTypeByHotelId.value[hotelId];
    }
  }
}, {immediate: true});

function setHotelTourType(hotelId: string, value: OffreTourType) {
  if (!hotelId) {
    return;
  }

  tourTypeByHotelId.value[hotelId] = value;
}

watch([activeRegionId, selectedDepartureId, selectedTimeframe], () => {
  currentPage.value = 1;
});

watch(totalPages, (nextTotalPages) => {
  if (currentPage.value > nextTotalPages) {
    currentPage.value = nextTotalPages;
  }
}, {immediate: true});
</script>

<template>
  <div class="offre-widget-container">
    <div
        v-sticky="navigationStickyOptions"
        class="offre-widget-navigation-shell rounded-2xl overflow-clip"
    >
      <div class="offre-widget-navigation gap-4 bg-white py-2">
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
            :departures="departures"
            :departures-loading="departuresLoading"
            :timeframe-options="timeframeOptions"
            :timeframes-loading="regionsLoading"
        />
        <ViewModeSwitch v-model="viewMode"/>
      </div>
    </div>

    <div
        v-if="viewMode === 'list'"
        class="mt-4"
    >
      <div
          v-if="requestState === 'loading'"
          class="rounded-2xl border bg-white px-4 py-6 text-sm text-muted-foreground"
      >
        Загрузка туров...
      </div>

      <div
          v-else-if="productsError"
          class="rounded-2xl border bg-white px-4 py-6 text-sm text-destructive"
      >
        Ошибка загрузки туров
      </div>

      <div
          v-else-if="noMatchedProducts"
          class="rounded-2xl border bg-white px-4 py-6 text-sm text-muted-foreground"
      >
        По выбранным параметрам ничего не найдено
      </div>

      <template v-else-if="productsList.length > 0">
        <OffreOffersList
            :products="paginatedProducts"
            :product-reference="productReference"
            :selected-departure-name="selectedDeparture?.name ?? ''"
            :pricing-mode="options.pricing"
            :hotel-runtime-by-id="hotelRuntimeById"
            :tour-type-by-hotel-id="tourTypeByHotelId"
            @update-tour-type="setHotelTourType"
        />

        <Pagination
            v-if="hasPagination"
            class="mt-6"
            v-model:page="currentPage"
            :items-per-page="PRODUCTS_PAGE_SIZE"
            :sibling-count="paginationSiblingCount"
            :total="totalProducts"
            :show-edges="paginationShowEdges"
        >
          <PaginationContent
              v-slot="{ items }"
              class="gap-2"
          >
            <PaginationPrevious
                size="icon-lg"
                class="size-10 rounded-lg border border-border bg-card p-0 text-foreground shadow-none hover:bg-secondary hover:text-primary gap-0 px-0 sm:pr-0"
            >
              <ChevronLeftIcon class="size-4"/>
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
                  ? 'size-10 rounded-lg border border-primary bg-primary p-0 text-primary-foreground shadow-none hover:bg-primary hover:text-primary-foreground'
                  : 'size-10 rounded-lg border border-border bg-card p-0 text-foreground shadow-none hover:bg-secondary hover:text-primary'"
              >
                {{ item.value }}
              </PaginationItem>

              <PaginationEllipsis
                  v-else
                  class="size-10 text-foreground"
              />
            </template>

            <PaginationNext
                size="icon-lg"
                class="size-10 rounded-lg border border-border bg-card p-0 text-foreground shadow-none hover:bg-secondary hover:text-primary gap-0 px-0 sm:pr-0"
            >
              <ChevronRightIcon class="size-4"/>
            </PaginationNext>
          </PaginationContent>
        </Pagination>
      </template>
    </div>

    <div
        v-else
        class="mt-4 rounded-2xl border bg-white px-4 py-6 text-sm text-muted-foreground"
    >
      Режим карты пока не подключен
    </div>
  </div>
</template>

<style scoped lang="scss">
.offre-widget-navigation-shell {
  transition: box-shadow 0.2s ease;
}

.offre-widget-navigation {
  display: grid;
  grid-template-columns: 1fr min-content;
  gap: 8px 8px;
  grid-auto-flow: row;
  grid-template-areas:
    "nav nav"
    "inputs switcher";
}

.offre-widget-navigation-shell.sticked {
  box-shadow: 0 0 14px rgba(0, 0, 0, 0.14);
}

.nav {
  grid-area: nav;
}
</style>
