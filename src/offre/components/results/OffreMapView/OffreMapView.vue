<script setup lang="ts">
import {useMediaQuery} from "@vueuse/core";
import {computed, onMounted, reactive, ref, shallowRef, type ComputedRef} from "vue";
import type {B2CPriceSearchReference, B2CProduct} from "@/offre/api";
import OffreMapClusterBadge from "@/offre/components/results/OffreMapClusterBadge/OffreMapClusterBadge.vue";
import OffreMapMarker from "@/offre/components/results/OffreMapMarker/OffreMapMarker.vue";
import OffreMapOverlayCard from "@/offre/components/results/OffreMapOverlayCard/OffreMapOverlayCard.vue";
import OffreMapSidebar from "@/offre/components/results/OffreMapSidebar/OffreMapSidebar.vue";
import {useOffreMapHotelOffers} from "@/offre/composables/useOffreMapHotelOffers";
import {useOffreMapLocation} from "@/offre/composables/useOffreMapLocation";
import {useOffreMapSelection} from "@/offre/composables/useOffreMapSelection";
import {useOffreMapViewState} from "@/offre/composables/useOffreMapViewState";
import type {NormalizedOffreWidgetOptions} from "@/offre/lib/payload";
import {
	getMapClusterPriceRange,
	normalizeMapCoordinate,
	type OffreMapSearchPoint
} from "@/offre/lib/offre-map";
import {
	createYmapsOptions,
	initYmaps,
	YandexMap,
	YandexMapClusterer,
	YandexMapControls,
	YandexMapDefaultFeaturesLayer,
	YandexMapDefaultSchemeLayer,
	YandexMapMarker,
	YandexMapOverlay,
	YandexMapZoomControl
} from "vue-yandex-maps";

const YMAPS_API_KEY = import.meta.env.VITE_YMAPS_API_KEY?.trim() ?? "";
let ymapsOptionsConfigured = false;
let ymapsInitializationPromise: Promise<void> | null = null;

function ensureYmapsInitialized(apiKey: string) {
	if (!ymapsOptionsConfigured) {
		createYmapsOptions({apikey: apiKey});
		ymapsOptionsConfigured = true;
	}

	if (!ymapsInitializationPromise) {
		ymapsInitializationPromise = initYmaps();
	}

	return ymapsInitializationPromise;
}

function resolveInitialMapLocation(products: B2CProduct[]) {
	for (const product of products) {
		const latitude = normalizeMapCoordinate(product.hotel?.coordinates?.latitude);
		const longitude = normalizeMapCoordinate(product.hotel?.coordinates?.longitude);

		if (latitude !== null && longitude !== null) {
			return {
				center: [longitude, latitude] as [number, number],
				zoom: 9
			};
		}
	}

	return {
		center: [37.617644, 55.755819] as [number, number],
		zoom: 9
	};
}

const props = defineProps<{
	visibleProducts: B2CProduct[];
	isLoadingBase?: boolean;
	pricingMode?: unknown;
	searchOptions: NormalizedOffreWidgetOptions;
	productReference: B2CPriceSearchReference;
	selectedDepartureName: string;
}>();

const ymapsInitialized = ref(false);
const map = shallowRef();
const clusterer = shallowRef();
const hotelSearchQuery = ref("");
const lastAutoLocationKey = ref("");
const hostname = typeof window === "undefined" ? "" : window.location.hostname;
const showBottomMapOverlay = useMediaQuery("(max-width: 1023px)");
const mapSettings = reactive({
	location: resolveInitialMapLocation(props.visibleProducts),
	controls: []
});

const {
	mapOfferMode,
	hotelOffersByHotelId,
	loadingHotelIds,
	mapOfferLoading
} = useOffreMapHotelOffers({
	products: computed(() => props.visibleProducts),
	searchOptions: computed(() => props.searchOptions)
});

let activeMapPointRef: ComputedRef<OffreMapSearchPoint | null> | null = null;

const mapViewState = useOffreMapViewState({
	visibleProductsSource: () => props.visibleProducts,
	hotelOffersByHotelIdSource: hotelOffersByHotelId,
	loadingHotelIdsSource: loadingHotelIds,
	mapOfferModeSource: mapOfferMode,
	pricingModeSource: () => props.pricingMode,
	hostnameSource: () => hostname,
	hotelSearchQuerySource: hotelSearchQuery,
	activeMapPointSource: () => activeMapPointRef?.value ?? null,
	productReferenceSource: () => props.productReference,
	selectedDepartureNameSource: () => props.selectedDepartureName
});

const {
	visibleMapPointsByHotelId,
	searchFilteredMapPoints,
	searchFilteredMapPointsByHotelId,
	searchFilteredHotelIds,
	activeMapOverlayModel,
	overlayBounds,
	hasBaseMapPoints
} = mapViewState;

const {
	activeHotelId,
	activeMapPoint,
	handleMarkerToggle,
	closeOverlay,
	selectPoint
} = useOffreMapSelection({
	map,
	mapPointsByHotelId: visibleMapPointsByHotelId,
	filteredMapPointsByHotelId: searchFilteredMapPointsByHotelId,
	filteredHotelIds: searchFilteredHotelIds,
	setLastAutoLocationKey(value) {
		lastAutoLocationKey.value = value;
	}
});
activeMapPointRef = activeMapPoint;

useOffreMapLocation({
	ymapsInitialized,
	map,
	points: searchFilteredMapPoints,
	activeHotelId,
	lastAutoLocationKeySource: lastAutoLocationKey,
	mapSettings
});

onMounted(async () => {
	if (!YMAPS_API_KEY) {
		console.warn("OffreWidget: Yandex Maps API key is not configured");
		return;
	}

	await ensureYmapsInitialized(YMAPS_API_KEY);
	ymapsInitialized.value = true;
});
</script>

<template>
	<section class="offre-map-view">
		<div
			v-if="!YMAPS_API_KEY"
			class="offre-map-view__state"
		>
			Карта временно недоступна
		</div>

		<div
			v-else-if="!ymapsInitialized"
			class="offre-map-view__state"
		>
			Загрузка карты...
		</div>

		<div
			v-else-if="!hasBaseMapPoints && !props.isLoadingBase"
			class="offre-map-view__state"
		>
			Для выбранных офферов нет координат отелей
		</div>

		<div
			v-else
			class="offre-map-view__canvas"
		>
			<OffreMapSidebar
				:points="searchFilteredMapPoints"
				:active-hotel-id="activeHotelId"
				:search-query="hotelSearchQuery"
				:map-offer-mode="mapOfferMode"
				:is-loading-base="Boolean(props.isLoadingBase)"
				:is-updating-prices="mapOfferLoading"
				@update:search-query="hotelSearchQuery = $event"
				@update:map-offer-mode="mapOfferMode = $event"
				@focus="selectPoint"
			/>

			<YandexMap
				v-model="map"
				:settings="mapSettings"
				class="offre-map-view__map"
			>
				<YandexMapDefaultSchemeLayer/>
				<YandexMapDefaultFeaturesLayer/>
				<YandexMapControls :settings="{ position: 'right' }">
					<YandexMapZoomControl/>
				</YandexMapControls>

				<YandexMapOverlay
					v-if="activeMapOverlayModel && overlayBounds && !showBottomMapOverlay"
					:key="`overlay-${activeMapOverlayModel.point.key}`"
					:settings="{ bounds: overlayBounds }"
				>
					<OffreMapOverlayCard
						class="offre-map-view__overlay-card"
						:model="activeMapOverlayModel"
						@click.stop
						@close="closeOverlay"
					/>
				</YandexMapOverlay>

				<YandexMapClusterer
					v-model="clusterer"
					:grid-size="90"
					zoom-on-cluster-click
				>
					<template #cluster="{ length, clusterer }">
						<OffreMapClusterBadge
							:count="length"
							:min-price="getMapClusterPriceRange(clusterer.features).min"
							:max-price="getMapClusterPriceRange(clusterer.features).max"
						/>
					</template>

					<YandexMapMarker
						v-for="point in searchFilteredMapPoints"
						:key="point.key"
						:settings="{ coordinates: [point.longitude, point.latitude], zIndex: activeHotelId === point.hotelId ? 1100 : 1, properties: { currentPriceValue: point.currentPriceValue }, onClick: () => handleMarkerToggle(point.hotelId) }"
					>
						<OffreMapMarker
							:hotel-id="point.hotelId"
							:price-label="point.currentPriceLabel"
							:is-family-club="point.isFamilyClub"
							:is-elite-hotel="point.isEliteHotel"
							:is-open="activeHotelId === point.hotelId"
							:is-loading="point.isLoadingPrice"
						/>
					</YandexMapMarker>
				</YandexMapClusterer>
			</YandexMap>

			<div
				v-if="activeMapOverlayModel && showBottomMapOverlay"
				class="offre-map-view__bottom-overlay"
			>
				<OffreMapOverlayCard
					:model="activeMapOverlayModel"
					mobile
					@close="closeOverlay"
				/>
			</div>
		</div>
	</section>
</template>

<style scoped src="./OffreMapView.scss" lang="scss"></style>
