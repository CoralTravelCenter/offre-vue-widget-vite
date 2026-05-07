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
import OffreResultsStateNotice from "offre/components/results/OffreResultsStateNotice.vue";
import {useOffreFiltersQueryState} from "offre/composables/useOffreFiltersQueryState";
import {useOffreProductsQuery} from "offre/composables/useOffreProductsQuery";
import {useOffreWidgetUiState} from "offre/composables/useOffreWidgetUiState";
import {useOffreWidgetListState} from "offre/composables/useOffreWidgetListState";
import {buildMapViewKey, buildWidgetPersistenceKey, shouldActivateMapView} from "offre/lib/offre-widget-root";
import {resolveProductsListState} from "offre/lib/offre-widget-view";
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
const CONTROLS_FIXED_Z_INDEX = 30;
const PAGINATION_FIXED_Z_INDEX = 20;
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
const widgetHotelIds = computed(() => {
	return props.hotelsList.map((hotelEntry) => getWidgetHotelId(hotelEntry));
});
const guestsPersistenceKey = computed(() => {
	return buildWidgetPersistenceKey({
		brandKey: props.brandKey,
		hotelIds: widgetHotelIds.value,
		options: props.options
	});
});
const viewModePersistenceKey = computed(() => {
	return buildWidgetPersistenceKey({
		brandKey: props.brandKey,
		hotelIds: widgetHotelIds.value,
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
	productsPartial,
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
const navigationFloating = ref(false);
const paginationFloating = ref(false);

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

const navigationFixedOptions = computed(() => ({
	top: resolveNavigationTopOffset(),
	side: "top",
	zIndex: CONTROLS_FIXED_Z_INDEX,
	alignment: "stretch",
	onStick: (fixedState: { fixed: boolean }) => {
		navigationFloating.value = fixedState.fixed;
	}
}));

const paginationFixedOptions = computed(() => ({
	bottom: STICKY_BOTTOM_OFFSET,
	side: "bottom",
	zIndex: PAGINATION_FIXED_Z_INDEX,
	alignment: "center",
	onStick: (fixedState: { fixed: boolean }) => {
		paginationFloating.value = fixedState.fixed;
	}
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
	if (shouldActivateMapView(nextValue)) {
		hasActivatedMapView.value = true;
	}
}, {immediate: true});

const mapViewKey = computed(() => {
	return buildMapViewKey({
		activeRegionId: activeRegionId.value,
		selectedDepartureId: selectedDepartureId.value,
		selectedTimeframe: selectedTimeframe.value,
		guestsFilterKey: guestsFilterKey.value
	});
});

const productsListState = computed(() => {
	return resolveProductsListState({
		requestState: requestState.value,
		productsError: productsError.value,
		productsPartial: productsPartial.value,
		noMatchedProducts: noMatchedProducts.value,
		hasProducts: productsList.value.length > 0
	});
});

function getPaginationItemClass(value: number) {
	return value === currentPage.value
			? "offre-widget__pagination-item offre-widget__pagination-item--active"
			: "offre-widget__pagination-item offre-widget__pagination-item--inactive";
}
</script>

<template>
	<div class="offre-widget offre-vue">

		<div
				v-fixed="navigationFixedOptions"
		>
			<div
					class="offre-widget__navigation grid grid-flow-row grid-cols-[1fr_min-content] gap-2 rounded-[var(--brand-radius-chip)] bg-brand-card py-2 [grid-template-areas:'nav_nav''inputs_switcher'] transition-shadow lg:grid-flow-col lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center lg:[grid-template-areas:'nav_inputs_switcher']"
					:class="{ sticked: navigationFloating }"
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
		</div>

		<div
				v-show="viewMode === 'list'"
				class="offre-widget__results offre-widget__results--list product-grid mt-4 overflow-visible"
		>
			<div class="offre-widget__debug-states mb-4 grid gap-4">
				<OffreResultsStateNotice
						title="Упс! Что-то пошло не так."
						description="Но мы это исправим, попробуйте зайти позже"
						variant="error"
				/>
				<OffreResultsStateNotice
						title="Увы, подходящих вариантов нет"
						description="Попробуйте изменить месяц, регион вылета или состав туристов"
						variant="warning"
				/>
			</div>

			<div
					v-if="requestState === 'loading'"
					:class="['offre-widget__state', productsListState.modifierClass]"
			>
				<OffreOffersListSkeleton/>
			</div>

			<div
					v-else-if="productsError"
					:class="['offre-widget__state', productsListState.modifierClass]"
			>
				<OffreResultsStateNotice
						:title="productsListState.title"
						:description="productsListState.description"
						variant="error"
				/>
			</div>

			<div
					v-else-if="noMatchedProducts"
					:class="['offre-widget__state', productsListState.modifierClass]"
			>
				<OffreResultsStateNotice
						:title="productsListState.title"
						:description="productsListState.description"
						variant="warning"
				/>
			</div>

			<template v-else-if="productsList.length > 0">
				<div
						v-if="productsListState.partialMessage"
						class="offre-widget__state offre-widget__state--warning mb-4"
				>
					{{ productsListState.partialMessage }}
				</div>

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

				<div
						v-if="hasPagination"
						v-fixed="paginationFixedOptions"
						class="offre-widget__pagination-shell mt-6"
				>
					<Pagination
							class="offre-widget__pagination pager !w-fit mx-auto flex justify-center"
							:class="paginationFloating ? 'sticked bg-white p-2 rounded-[16px]' : ''"
							v-model:page="currentPage"
							:items-per-page="PRODUCTS_PAGE_SIZE"
							:sibling-count="paginationSiblingCount"
							:total="totalProducts"
							:show-edges="paginationShowEdges"
					>
						<PaginationContent
								v-slot="{ items }"
								class="offre-widget__pagination-content w-fit items-center gap-2"
						>
								<PaginationPrevious
										size="icon-lg"
										class="offre-widget__pagination-control offre-widget__pagination-control--previous h-10 w-10 rounded-[var(--margin-marginXS,8px)] border border-brand-border bg-[var(--colorBgContainer,#fff)] !p-0 text-(length:--brand-text-body) leading-(--brand-leading-control) text-brand-foreground hover:bg-[var(--colorBgContainer,#fff)] hover:border-brand-primary hover:text-brand-primary"
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
											size="brand"
											:value="item.value"
											:class="[
												'h-10 w-10 rounded-[var(--margin-marginXS,8px)] border border-brand-border bg-[var(--colorBgContainer,#fff)] p-0 text-(length:--brand-text-body) leading-(--brand-leading-control)',
												getPaginationItemClass(item.value)
											]"
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
										class="offre-widget__pagination-control offre-widget__pagination-control--next h-10 w-10 rounded-[var(--margin-marginXS,8px)] border border-brand-border bg-[var(--colorBgContainer,#fff)] !p-0 text-(length:--brand-text-body) leading-(--brand-leading-control) text-brand-foreground hover:bg-[var(--colorBgContainer,#fff)] hover:border-brand-primary hover:text-brand-primary"
								>
									<ChevronRightIcon class="offre-widget__pagination-icon size-4"/>
								</PaginationNext>
						</PaginationContent>
					</Pagination>
				</div>
			</template>
		</div>

		<div
				v-if="hasActivatedMapView"
				v-show="viewMode === 'map'"
				class="offre-widget__results offre-widget__results--map mt-4 overflow-visible pr-0"
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
.offre-widget__navigation.sticked {
	box-shadow: var(--brand-shadow-widget);
}

.offre-widget__pagination.sticked {
	box-shadow: var(--brand-shadow-widget);
}

.offre-widget__tabs {
	grid-area: nav;
}

.offre-widget__pagination-item--active {
	border-color: var(--brand-primary);
	background: var(--brand-primary);
	color: var(--brand-primary-foreground);
}

.offre-widget__pagination-item--inactive {
	color: var(--brand-foreground);
}

.offre-widget__pagination-item--inactive:hover {
	border-color: var(--brand-primary);
	color: var(--brand-primary);
}

.offre-widget__pagination-item--active:hover {
	border-color: var(--brand-primary);
	background: var(--brand-primary);
	color: var(--brand-primary-foreground);
}
</style>
