<script setup lang="ts">
import {useMediaQuery} from "@vueuse/core";
import {LoaderCircle} from "lucide-vue-next";
import {computed, ref, shallowRef, watch} from "vue";
import type {B2CPriceSearchReference, B2CProduct} from "@/offre/api";
import OffreControls from "@/offre/components/OffreControls/OffreControls.vue";
import ViewModeSwitch from "@/offre/components/ViewModeSwitch/ViewModeSwitch.vue";
import RegionTabsNav from "@/offre/components/RegionTabsNav/RegionTabsNav.vue";
import OffreOffersList from "@/offre/components/results/OffreOffersList/OffreOffersList.vue";
import OffreOffersListSkeleton from "@/offre/components/results/OffreOffersListSkeleton/OffreOffersListSkeleton.vue";
import OffreMapViewSkeleton from "@/offre/components/results/OffreMapViewSkeleton/OffreMapViewSkeleton.vue";
import OffreMapView from "@/offre/components/results/OffreMapView/OffreMapView.vue";
import OffreResultsStateNotice from "@/offre/components/results/OffreResultsStateNotice/OffreResultsStateNotice.vue";
import {useOffreFiltersQueryState} from "@/offre/composables/useOffreFiltersQueryState";
import {useOffreProductsQuery} from "@/offre/composables/useOffreProductsQuery";
import {useOffreWidgetUiState} from "@/offre/composables/useOffreWidgetUiState";
import {useOffreWidgetListState} from "@/offre/composables/useOffreWidgetListState";
import {buildMapViewKey, buildWidgetPersistenceKey, shouldActivateMapView} from "@/offre/lib/offre-widget-root";
import {resolveProductsListState} from "@/offre/lib/offre-widget-view";
import {Button} from "@/components/ui/button";
import {
	getWidgetHotelId,
	type NormalizedOffreWidgetOptions,
	type NormalizedWidgetHotelDescriptor
} from "@/offre/lib/payload";
import type {BrandDefinition, BrandKey} from "@/brands/types";
import type {OffreViewMode} from "@/offre/types";

const DESKTOP_LAYOUT_BREAKPOINT = "(min-width: 1024px)";
const TABLET_LAYOUT_BREAKPOINT = "(min-width: 768px)";
const STICKY_BOTTOM_OFFSET = 16;
const CONTROLS_FIXED_Z_INDEX = 30;
const LOAD_MORE_FIXED_Z_INDEX = 20;
const MV_MODE_TOP_OFFSET = 76;
const DESKTOP_TOP_OFFSET = 16;
const TABLET_TOP_OFFSET = 57;
const MOBILE_TOP_OFFSET = 74;
const PRODUCTS_PAGE_SIZE = 5;

interface OffreWidgetRootProps {
	instanceId: string;
	brandKey: BrandKey;
	brandDefinition: BrandDefinition;
	options: NormalizedOffreWidgetOptions;
	hotelsList: NormalizedWidgetHotelDescriptor[];
}

const props = defineProps<OffreWidgetRootProps>();

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

const isMvMode = computed(() => {
	if (typeof window === "undefined") {
		return false;
	}

	return new URLSearchParams(window.location.search).get("mv") === "true";
});

const isLargeScreen = useMediaQuery(DESKTOP_LAYOUT_BREAKPOINT);
const isTabletScreen = useMediaQuery(TABLET_LAYOUT_BREAKPOINT);
const navigationFloating = ref(false);
const loadMoreFloating = ref(false);

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

const loadMoreFixedOptions = computed(() => ({
	bottom: STICKY_BOTTOM_OFFSET,
	side: "bottom",
	zIndex: LOAD_MORE_FIXED_Z_INDEX,
	alignment: "center",
	onStick: (fixedState: { fixed: boolean }) => {
		loadMoreFloating.value = fixedState.fixed;
	}
}));

const departuresLoading = computed(() => departuresQuery.isPending.value);
const hasActivatedMapView = ref(false);
const viewMode = ref<OffreViewMode>("list");
const currentPage = ref(1);
const productsListSource = shallowRef<B2CProduct[]>([]);
const productReferenceSource = shallowRef<B2CPriceSearchReference>({});
const loadMoreIssueMessage = ref("");
const isRollingBackLoadMore = ref(false);
const hotelRuntimeById = computed(() => {
	return matchedHotelsDirectory.value.reduce<Map<string, typeof matchedHotelsDirectory.value[number]>>((accumulator, hotel) => {
		accumulator.set(String(hotel.id), hotel);
		return accumulator;
	}, new Map<string, typeof matchedHotelsDirectory.value[number]>());
});
const isListPageMode = computed(() => {
	return viewMode.value === "list";
});

const {
	totalProducts,
	hasPagination,
	canLoadMore,
	paginatedProducts,
	tourTypeByHotelId,
	setHotelTourType
} = useOffreWidgetListState({
	productsSource: productsListSource,
	activeRegionIdSource: activeRegionId,
	selectedDepartureIdSource: selectedDepartureId,
	selectedTimeframeSource: selectedTimeframe,
	guestsFilterKeySource: guestsFilterKey,
	storageKeySource: viewModePersistenceKey,
	totalItemsSource: computed(() => {
		return isListPageMode.value ? matchedHotelsDirectory.value.length : productsListSource.value.length;
	}),
	prePaginatedSource: isListPageMode,
	viewModeRef: viewMode,
	currentPageRef: currentPage,
	pageSize: PRODUCTS_PAGE_SIZE
});

const {
	noMatchedProducts,
	productsPartial,
	productsError,
	productsInitialLoading,
	productsList,
	productsRefetching,
	productReference,
	requestState
} = useOffreProductsQuery({
	optionsSource: effectiveSearchOptions,
	hotelsSource: matchedHotelsDirectory,
	hotelInfoByIdSource: hotelInfoById,
	selectedTimeframeSource: selectedTimeframe,
	selectedDepartureSource: selectedDeparture,
	hotelOrderByIdSource: hotelOrderById,
	currentPageSource: currentPage,
	pageSizeSource: computed(() => PRODUCTS_PAGE_SIZE),
	serverPageModeSource: isListPageMode
});

watch(productsList, (nextProducts) => {
	if (nextProducts.length > 0 || currentPage.value === 1) {
		productsListSource.value = nextProducts;
	}
}, {immediate: true});

watch(productReference, (nextReference) => {
	if (productsList.value.length > 0 || currentPage.value === 1) {
		productReferenceSource.value = nextReference;
	}
}, {immediate: true});

watch([productsError, noMatchedProducts, productsRefetching], ([hasError, hasNoMatched, isRefetching]) => {
	if (isRefetching || currentPage.value <= 1 || isRollingBackLoadMore.value) {
		return;
	}

	if (!hasError && !hasNoMatched) {
		loadMoreIssueMessage.value = "";
		return;
	}

	isRollingBackLoadMore.value = true;
	loadMoreIssueMessage.value = hasError
			? "Не удалось загрузить дополнительные варианты. Уже найденные отели остаются на экране."
			: "Для следующей порции подходящих вариантов не нашлось. Уже найденные отели остаются на экране.";
	currentPage.value -= 1;
});

watch(productsRefetching, (isRefetching) => {
	if (!isRefetching) {
		isRollingBackLoadMore.value = false;
	}
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
		productsError: productsError.value && productsListSource.value.length === 0,
		productsPartial: productsPartial.value,
		noMatchedProducts: noMatchedProducts.value && productsListSource.value.length === 0,
		hasProducts: productsListSource.value.length > 0
	});
});

const loadMoreSkeletonItems = computed(() => {
	if (!productsRefetching.value || !canLoadMore.value) {
		return 0;
	}

	const remainingItems = Math.max(0, totalProducts.value - paginatedProducts.value.length);
	return Math.min(PRODUCTS_PAGE_SIZE, remainingItems);
});

const remainingProductsCount = computed(() => {
	return Math.max(0, totalProducts.value - paginatedProducts.value.length);
});

const nextLoadCount = computed(() => {
	return Math.min(PRODUCTS_PAGE_SIZE, remainingProductsCount.value);
});

const loadMoreButtonLabel = computed(() => {
	if (productsRefetching.value) {
		return "Загрузка...";
	}

	return "Показать ещё";
});

function handleLoadMore() {
	if (!canLoadMore.value) {
		return;
	}

	loadMoreIssueMessage.value = "";
	currentPage.value += 1;
}
</script>

<template>
	<div
			class="offre-widget offre-vue"
			:data-offre-widget-instance="instanceId"
	>
		<div v-fixed="navigationFixedOptions">
			<div
					class="offre-widget__navigation"
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
				class="offre-widget__results offre-widget__results--list"
		>
			<div
					v-if="productsInitialLoading"
					:class="['offre-widget__state', productsListState.modifierClass]"
			>
				<OffreOffersListSkeleton/>
			</div>

			<div
					v-else-if="productsError && productsListSource.length === 0"
					:class="['offre-widget__state', productsListState.modifierClass]"
			>
				<OffreResultsStateNotice
						:title="productsListState.title"
						:description="productsListState.description"
						variant="error"
				/>
			</div>

			<div
					v-else-if="noMatchedProducts && productsListSource.length === 0"
					:class="['offre-widget__state', productsListState.modifierClass]"
			>
				<OffreResultsStateNotice
						:title="productsListState.title"
						:description="productsListState.description"
						variant="warning"
				/>
			</div>

			<template v-else-if="productsListSource.length > 0">
				<div
						v-if="productsListState.partialMessage"
						class="offre-widget__state offre-widget__state--warning"
				>
					{{ productsListState.partialMessage }}
				</div>

				<div
						v-if="loadMoreIssueMessage"
						class="offre-widget__state offre-widget__state--warning"
				>
					{{ loadMoreIssueMessage }}
				</div>

				<OffreOffersList
						:products="paginatedProducts"
						:product-reference="productReferenceSource"
						:selected-departure-name="selectedDeparture?.name ?? ''"
						:pricing-mode="effectiveSearchOptions.pricing"
						:search-options="effectiveSearchOptions"
						:brand-key="brandKey"
						:hotel-runtime-by-id="hotelRuntimeById"
						:tour-type-by-hotel-id="tourTypeByHotelId"
						@update-tour-type="setHotelTourType"
				/>

				<OffreOffersListSkeleton
						v-if="loadMoreSkeletonItems > 0"
						:items="loadMoreSkeletonItems"
						class="offre-widget__load-more-skeleton"
				/>

				<div
						v-if="hasPagination"
						v-fixed="loadMoreFixedOptions"
						class="offre-widget__load-more-shell"
				>
					<div
							:class="[
							'offre-widget__load-more-panel',
							{ 'offre-widget__load-more-panel--floating': loadMoreFloating }
						]"
					>
						<div class="offre-widget__load-more-meta">
							Показано {{ paginatedProducts.length }} из {{ totalProducts }}
						</div>

						<Button
								v-if="canLoadMore"
								type="button"
								variant="default"
								size="brand"
								class="offre-widget__load-more-button"
								:disabled="productsRefetching"
								@click="handleLoadMore"
						>
							<LoaderCircle
									v-if="productsRefetching"
									class="offre-widget__load-more-spinner"
							/>
							{{ loadMoreButtonLabel }}
						</Button>
						<div
								v-else
								class="offre-widget__load-more-summary"
						>
							Показаны все {{ totalProducts }} отелей
						</div>
					</div>
				</div>
			</template>
		</div>

		<div
				v-if="hasActivatedMapView"
				v-show="viewMode === 'map'"
				class="offre-widget__results offre-widget__results--map"
		>
			<OffreMapViewSkeleton v-if="requestState === 'loading'"/>

			<OffreMapView
					v-else
					:key="mapViewKey"
					:visible-products="productsList"
					:pricing-mode="effectiveSearchOptions.pricing"
					:search-options="effectiveSearchOptions"
					:product-reference="productReference"
					:selected-departure-name="selectedDeparture?.name ?? ''"
			/>
		</div>
	</div>
</template>

<style scoped src="./OffreWidgetRoot.scss" lang="scss"></style>
