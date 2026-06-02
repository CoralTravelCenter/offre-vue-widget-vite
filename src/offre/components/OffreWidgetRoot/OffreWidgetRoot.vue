<script setup lang="ts">
import {LoaderCircle} from "lucide-vue-next";
import {computed, ref} from "vue";
import OffreControls from "@/offre/components/OffreControls/OffreControls.vue";
import ViewModeSwitch from "@/offre/components/ViewModeSwitch/ViewModeSwitch.vue";
import RegionTabsNav from "@/offre/components/RegionTabsNav/RegionTabsNav.vue";
import OffreOffersList from "@/offre/components/results/OffreOffersList/OffreOffersList.vue";
import OffreOffersListSkeleton from "@/offre/components/results/OffreOffersListSkeleton/OffreOffersListSkeleton.vue";
import OffreMapViewSkeleton from "@/offre/components/results/OffreMapViewSkeleton/OffreMapViewSkeleton.vue";
import OffreMapView from "@/offre/components/results/OffreMapView/OffreMapView.vue";
import OffreResultsStateNotice from "@/offre/components/results/OffreResultsStateNotice/OffreResultsStateNotice.vue";
import {useOffreFiltersQueryState} from "@/offre/composables/useOffreFiltersQueryState";
import {useOffreLoadMoreState} from "@/offre/composables/useOffreLoadMoreState";
import {useOffreProductsCacheState} from "@/offre/composables/useOffreProductsCacheState";
import {useOffreProductsQuery} from "@/offre/composables/useOffreProductsQuery";
import {useOffreRegionPagingState} from "@/offre/composables/useOffreRegionPagingState";
import {useOffreWidgetLayoutState} from "@/offre/composables/useOffreWidgetLayoutState";
import {useOffreWidgetListState} from "@/offre/composables/useOffreWidgetListState";
import {useOffreWidgetResultsState} from "@/offre/composables/useOffreWidgetResultsState";
import {useOffreWidgetRuntimeState} from "@/offre/composables/useOffreWidgetRuntimeState";
import {useOffreWidgetSessionState} from "@/offre/composables/useOffreWidgetSessionState";
import {useOffreWidgetUiState} from "@/offre/composables/useOffreWidgetUiState";
import {Button} from "@/components/ui/button";
import {
	getWidgetHotelId,
	type NormalizedOffreWidgetOptions,
	type NormalizedWidgetHotelDescriptor
} from "@/offre/lib/payload";
import {buildWidgetPersistenceKey} from "@/offre/lib/offre-widget-root";
import type {BrandDefinition, BrandKey} from "@/brands/types";
import type {OffreViewMode} from "@/offre/types";

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

const {
	defaultGuests,
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
	viewModePersistenceKey,
	resetNonce
} = useOffreWidgetSessionState({
	brandKeySource: () => props.brandKey,
	hotelIdsSource: widgetHotelIds,
	optionsSource: () => props.options,
	effectiveSearchOptionsSource: effectiveSearchOptions,
	selectedDepartureIdSource: selectedDepartureId,
	selectedTimeframeSource: selectedTimeframe,
	guestsFilterKeySource: guestsFilterKey
});

const departuresLoading = computed(() => departuresQuery.isPending.value);
const viewMode = ref<OffreViewMode>("list");
const currentProductsResetSignal = computed(() => resetNonce.value);
const {currentPage} = useOffreRegionPagingState({
	activeRegionIdSource: activeRegionId,
	resetSignalSource: currentProductsResetSignal
});

const {
	hotelRuntimeById,
	isListPageMode,
	visibleMatchedHotels
} = useOffreWidgetRuntimeState({
	matchedHotelsSource: matchedHotelsDirectory,
	viewModeRef: viewMode,
	currentPageRef: currentPage,
	pageSize: PRODUCTS_PAGE_SIZE
});

let productsQueryState: ReturnType<typeof useOffreProductsQuery> | null = null;

const cacheState = useOffreProductsCacheState({
	activeRegionIdSource: activeRegionId,
	matchedHotelsSource: matchedHotelsDirectory,
	visibleMatchedHotelsSource: visibleMatchedHotels,
	productsListSource: () => productsQueryState?.productsList.value ?? [],
	productReferenceSource: () => productsQueryState?.productReference.value ?? {},
	requestStateSource: () => productsQueryState?.requestState.value ?? "idle",
	productsErrorSource: () => productsQueryState?.productsError.value ?? false,
	noMatchedProductsSource: () => productsQueryState?.noMatchedProducts.value ?? false,
	queriedHotelIdsSource: () => productsQueryState?.queriedHotelIds.value ?? [],
	productsFetchingSource: () => productsQueryState?.productsFetching.value ?? false,
	isListPageModeSource: isListPageMode,
	resetSignalSource: currentProductsResetSignal
});

productsQueryState = useOffreProductsQuery({
	optionsSource: effectiveSearchOptions,
	hotelsSource: matchedHotelsDirectory,
	hotelInfoByIdSource: hotelInfoById,
	selectedTimeframeSource: selectedTimeframe,
	selectedDepartureSource: selectedDeparture,
	hotelOrderByIdSource: hotelOrderById,
	enabledSource: cacheState.shouldFetchRegionProducts,
	currentPageSource: currentPage,
	pageSizeSource: computed(() => PRODUCTS_PAGE_SIZE),
	serverPageModeSource: isListPageMode
});

const {
	noMatchedProducts,
	productsPartial,
	productsError,
	productsFetching,
	productsInitialLoading,
	productsRefetching,
} = productsQueryState;

const {
	regionProductsSource,
	mapProductsSource,
	productReferenceSource,
	effectiveRequestState,
	effectiveProductsError,
	effectiveNoMatchedProducts,
	shouldFetchRegionProducts
} = cacheState;

const {
	totalProducts,
	hasPagination,
	canLoadMore,
	paginatedProducts,
	tourTypeByHotelId,
	setHotelTourType
} = useOffreWidgetListState({
	productsSource: regionProductsSource,
	activeRegionIdSource: activeRegionId,
	resetOnActiveRegionChange: false,
	selectedDepartureIdSource: selectedDepartureId,
	selectedTimeframeSource: selectedTimeframe,
	guestsFilterKeySource: guestsFilterKey,
	storageKeySource: viewModePersistenceKey,
	totalItemsSource: computed(() => {
		return isListPageMode.value ? matchedHotelsDirectory.value.length : regionProductsSource.value.length;
	}),
	prePaginatedSource: isListPageMode,
	viewModeRef: viewMode,
	currentPageRef: currentPage,
	pageSize: PRODUCTS_PAGE_SIZE
});

const {
	loadMoreIssueMessage,
	loadMoreSkeletonItems,
	loadMoreButtonLabel,
	handleLoadMore
} = useOffreLoadMoreState({
	currentPageRef: currentPage,
	canLoadMoreSource: canLoadMore,
	totalProductsSource: totalProducts,
	paginatedProductsLengthSource: computed(() => paginatedProducts.value.length),
	productsRefetchingSource: productsRefetching,
	productsErrorSource: productsError,
	noMatchedProductsSource: noMatchedProducts,
	resetSignalSource: currentProductsResetSignal,
	pageSize: PRODUCTS_PAGE_SIZE
});

const {
	navigationFixedOptions,
	navigationFloating,
	hasActivatedMapView,
	mapViewKey
} = useOffreWidgetLayoutState({
	viewModeRef: viewMode,
	activeRegionIdSource: activeRegionId,
	selectedDepartureIdSource: selectedDepartureId,
	selectedTimeframeSource: selectedTimeframe,
	guestsFilterKeySource: guestsFilterKey
});

const {
	productsListState,
	mapProductsState,
	showRegionSkeleton,
	showMapSkeleton
} = useOffreWidgetResultsState({
	effectiveRequestStateSource: effectiveRequestState,
	effectiveProductsErrorSource: effectiveProductsError,
	effectiveNoMatchedProductsSource: effectiveNoMatchedProducts,
	productsPartialSource: productsPartial,
	regionProductsCountSource: computed(() => regionProductsSource.value.length),
	mapProductsCountSource: computed(() => mapProductsSource.value.length),
	shouldFetchRegionProductsSource: shouldFetchRegionProducts,
	productsInitialLoadingSource: productsInitialLoading,
	productsRefetchingSource: productsRefetching,
	productsFetchingSource: productsFetching,
	isListPageModeSource: isListPageMode
});
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
					:default-adults-count="defaultGuests.adultsCount"
					:default-children-ages="defaultGuests.childrenAges"
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
				v-if="showRegionSkeleton"
				:class="['offre-widget__state', productsListState.modifierClass]"
			>
				<OffreOffersListSkeleton/>
			</div>

			<div
				v-else-if="effectiveProductsError && regionProductsSource.length === 0"
				:class="['offre-widget__state', productsListState.modifierClass]"
			>
				<OffreResultsStateNotice
						:title="productsListState.title"
						:description="productsListState.description"
						variant="error"
				/>
			</div>

			<div
				v-else-if="effectiveNoMatchedProducts && regionProductsSource.length === 0"
				:class="['offre-widget__state', productsListState.modifierClass]"
			>
				<OffreResultsStateNotice
						:title="productsListState.title"
						:description="productsListState.description"
						variant="warning"
				/>
			</div>

			<template v-else-if="regionProductsSource.length > 0">
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
					v-if="hasPagination && canLoadMore"
					class="offre-widget__load-more-shell"
				>
					<div
						class="offre-widget__load-more-panel"
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
					</div>
				</div>
			</template>
		</div>

		<div
				v-if="hasActivatedMapView"
				v-show="viewMode === 'map'"
				class="offre-widget__results offre-widget__results--map"
		>
			<div
				v-if="showMapSkeleton"
				:class="['offre-widget__state', mapProductsState.modifierClass]"
			>
				<OffreMapViewSkeleton/>
			</div>

			<div
				v-else-if="effectiveProductsError && mapProductsSource.length === 0"
				:class="['offre-widget__state', mapProductsState.modifierClass]"
			>
				<OffreResultsStateNotice
					:title="mapProductsState.title"
					:description="mapProductsState.description"
					variant="error"
				/>
			</div>

			<div
				v-else-if="effectiveNoMatchedProducts && mapProductsSource.length === 0"
				:class="['offre-widget__state', mapProductsState.modifierClass]"
			>
				<OffreResultsStateNotice
					:title="mapProductsState.title"
					:description="mapProductsState.description"
					variant="warning"
				/>
			</div>

			<template v-else>
				<div
					v-if="mapProductsState.partialMessage"
					class="offre-widget__state offre-widget__state--warning"
				>
					{{ mapProductsState.partialMessage }}
				</div>

				<OffreMapView
					v-else
					:key="mapViewKey"
					:visible-products="mapProductsSource"
					:pricing-mode="effectiveSearchOptions.pricing"
					:search-options="effectiveSearchOptions"
					:product-reference="productReferenceSource"
					:selected-departure-name="selectedDeparture?.name ?? ''"
				/>
			</template>
		</div>
	</div>
</template>

<style scoped src="./OffreWidgetRoot.scss" lang="scss"></style>
