<script setup lang="ts">
import {useMediaQuery} from "@vueuse/core";
import {computed, onMounted, reactive, ref, shallowRef} from "vue";
import type {B2CPriceSearchReference, B2CProduct} from "@/offre/api";
import OffreMapClusterBadge from "@/offre/components/results/OffreMapClusterBadge/OffreMapClusterBadge.vue";
import OffreMapMarker from "@/offre/components/results/OffreMapMarker/OffreMapMarker.vue";
import OffreMapOverlayCard from "@/offre/components/results/OffreMapOverlayCard/OffreMapOverlayCard.vue";
import OffreMapSidebar from "@/offre/components/results/OffreMapSidebar/OffreMapSidebar.vue";
import type {OffreMapOverlayModel} from "@/offre/lib/offre-map";
import {useOffreMapHotelOffers} from "@/offre/composables/useOffreMapHotelOffers";
import {useOffreMapLocation} from "@/offre/composables/useOffreMapLocation";
import {useOffreMapSelection} from "@/offre/composables/useOffreMapSelection";
import {useOffreOfferTerms} from "@/offre/composables/useOffreOfferTerms";
import type {NormalizedOffreWidgetOptions} from "@/offre/lib/payload";
import {
	buildBaseMapPoints,
	buildHotelIdSet,
	buildMapSearchPoints,
	buildPointsByHotelId,
	getMapClusterPriceRange,
	getMapReferenceValue,
	normalizeMapSearchValue,
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

const props = defineProps<{
	visibleProducts: B2CProduct[];
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
	location: {
		center: [37.617644, 55.755819] as [number, number],
		zoom: 9
	},
	controls: []
});

const baseMapPoints = computed(() => {
	return buildBaseMapPoints(props.visibleProducts);
});

const {
	mapOfferMode,
	hotelOffersByHotelId,
	mapOfferLoading
} = useOffreMapHotelOffers({
	products: computed(() => props.visibleProducts),
	searchOptions: computed(() => props.searchOptions)
});

const visibleMapPoints = computed<OffreMapSearchPoint[]>(() => {
	return buildMapSearchPoints({
		points: baseMapPoints.value,
		hotelOffersByHotelId: hotelOffersByHotelId.value,
		mapOfferMode: mapOfferMode.value,
		pricingMode: props.pricingMode,
		hostname
	});
});

const sortedVisibleMapPoints = computed(() => {
	return [...visibleMapPoints.value].sort((left, right) => {
		return left.hotelName.localeCompare(right.hotelName, "ru-RU");
	});
});

const searchFilteredMapPoints = computed(() => {
	const searchValue = normalizeMapSearchValue(hotelSearchQuery.value);

	if (!searchValue) {
		return sortedVisibleMapPoints.value;
	}

	return sortedVisibleMapPoints.value.filter((point) => {
		return normalizeMapSearchValue(point.hotelName).includes(searchValue);
	});
});
const visibleMapPointsByHotelId = computed(() => {
	return buildPointsByHotelId(visibleMapPoints.value);
});
const searchFilteredMapPointsByHotelId = computed(() => {
	return buildPointsByHotelId(searchFilteredMapPoints.value);
});
const searchFilteredHotelIds = computed(() => {
	return buildHotelIdSet(searchFilteredMapPoints.value);
});
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
const activeMapPointHotelStarCount = computed(() => {
	const hotelCategory = getMapReferenceValue<{ starCount?: number }>(
		props.productReference,
		"hotelCategories",
		activeMapPoint.value?.categoryKey
	);

	return Number(hotelCategory?.starCount) || 0;
});
const activeMapPointStarItems = computed<boolean[]>(() => {
	return Array.from({length: activeMapPointHotelStarCount.value}, () => true);
});
const {
	terms: activeMapPointTerms
} = useOffreOfferTerms({
	offer: computed(() => activeMapPoint.value?.effectiveOffer ?? null),
	productReference: computed(() => props.productReference),
	selectedDepartureName: computed(() => props.selectedDepartureName)
});
const activeMapOverlayModel = computed<OffreMapOverlayModel | null>(() => {
	if (!activeMapPoint.value) {
		return null;
	}

	return {
		point: activeMapPoint.value,
		terms: activeMapPointTerms.value,
		starItems: activeMapPointStarItems.value
	};
});
const overlayBounds = computed<[[number, number], [number, number]] | null>(() => {
	if (!activeMapPoint.value) {
		return null;
	}

	const longitude = activeMapPoint.value.longitude;
	const latitude = activeMapPoint.value.latitude;
	const longitudeDelta = 0.0001;
	const latitudeDelta = 0.0001;

	return [
		[longitude - longitudeDelta, latitude + latitudeDelta],
		[longitude + longitudeDelta, latitude - latitudeDelta]
	];
});
const hasBaseMapPoints = computed(() => visibleMapPoints.value.length > 0);

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

	createYmapsOptions({apikey: YMAPS_API_KEY});
	await initYmaps();
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
			v-else-if="!hasBaseMapPoints"
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
							:is-loading="mapOfferLoading"
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
