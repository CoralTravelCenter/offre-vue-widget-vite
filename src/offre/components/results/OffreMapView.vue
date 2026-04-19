<script setup lang="ts">
import { useMediaQuery } from "@vueuse/core";
import {computed, nextTick, onMounted, reactive, ref, shallowRef, watch} from "vue";
import type {B2CPriceSearchReference, B2CProduct} from "offre/api/types";
import OffreMapClusterBadge from "offre/components/results/OffreMapClusterBadge.vue";
import OffreMapMarker from "offre/components/results/OffreMapMarker.vue";
import OffreMapOverlayCard from "offre/components/results/OffreMapOverlayCard.vue";
import OffreMapSidebar from "offre/components/results/OffreMapSidebar.vue";
import type {OffreMapDisplayPoint, OffreMapOverlayModel } from "offre/components/results/offre-map.types";
import {useOffreMapHotelOffers} from "offre/composables/useOffreMapHotelOffers";
import {useOffreMapLocation} from "offre/composables/useOffreMapLocation";
import {useOffreOfferTerms} from "offre/composables/useOffreOfferTerms";
import type {NormalizedOffreWidgetOptions} from "offre/lib/payload";
import {
	getMapClusterPriceRange,
	getMapReferenceValue,
	getOfferPassengersCount,
	getPrimaryMapOffer,
	normalizeMapCoordinate,
	normalizeMapSearchValue
} from "offre/lib/offre-map";
import {
	formatCurrencySafe,
	resolveHotelImageUrl,
	resolveOfferHref,
	resolveOfferPartySuffix,
	resolveOfferPriceValue,
	stripEnglishBracketFragments
} from "offre/lib/product-offer";
import {
	createYmapsOptions,
	initYmaps,
	YandexMap,
	YandexMapClusterer,
	YandexMapDefaultFeaturesLayer,
	YandexMapDefaultSchemeLayer,
	YandexMapMarker,
	YandexMapOverlay
} from "vue-yandex-maps";

const YMAPS_API_KEY = "49de5080-fb39-46f1-924b-dee5ddbad2f1";

const props = defineProps<{
	products: B2CProduct[];
	pricingMode?: unknown;
	searchOptions: NormalizedOffreWidgetOptions;
	productReference: B2CPriceSearchReference;
	selectedDepartureName: string;
}>();

const ymapsInitialized = ref(false);
const map = shallowRef();
const clusterer = shallowRef();
const activeHotelId = ref<string | null>(null);
const popupHotelId = ref<string | null>(null);
const hotelSearchQuery = ref("");
const showBottomMapOverlay = useMediaQuery("(max-width: 1023px)");
const mapSettings = reactive({
	location: {
		center: [37.617644, 55.755819] as [number, number],
		zoom: 9
	},
	controls: []
});

type OffreMapSearchPoint = OffreMapDisplayPoint & {
	searchIndex: string;
};

const baseMapPoints = computed(() => {
	return props.products
			.map((product, index) => {
				const hotel = product.hotel ?? {};
				const coordinates = hotel.coordinates ?? null;
				const latitude = normalizeMapCoordinate(coordinates?.latitude);
				const longitude = normalizeMapCoordinate(coordinates?.longitude);
				const packageOffer = getPrimaryMapOffer(product);
				const hotelId = String(hotel.id ?? hotel.name ?? index);

				if (latitude === null || longitude === null) {
					return null;
				}

				return {
					key: String(hotel.id ?? hotel.name ?? index),
					hotelId,
					hotelName: stripEnglishBracketFragments(hotel.name) || "Без названия",
					locationLabel: stripEnglishBracketFragments(hotel.locationSummary),
					imageUrl: resolveHotelImageUrl(hotel.images),
					latitude,
					longitude,
					categoryKey: hotel.categoryKey,
					packageOffer,
					isFamilyClub: Boolean(hotel.sunFamilyClub || hotel.coralFamilyClub),
					isEliteHotel: Boolean(hotel.eliteHotel)
				};
			})
			.filter((point): point is NonNullable<typeof point> => point !== null);
});

const {
	mapOfferMode,
	hotelOffersByHotelId,
	mapOfferLoading
} = useOffreMapHotelOffers({
	products: computed(() => props.products),
	searchOptions: computed(() => props.searchOptions)
});

const mapPoints = computed<OffreMapSearchPoint[]>(() => {
	return baseMapPoints.value.map((point) => {
		const effectiveOffer = mapOfferMode.value === "hotel"
				? hotelOffersByHotelId.value.get(point.hotelId) ?? point.packageOffer
				: point.packageOffer;
		const passengersCount = getOfferPassengersCount(effectiveOffer);
		const stayNights = Number(effectiveOffer?.stayNights) || 0;
		const currentPriceValue = resolveOfferPriceValue(
				effectiveOffer?.price?.amount,
				props.pricingMode,
				passengersCount,
				stayNights
		);

		return {
			...point,
			effectiveOffer,
			currentPriceValue,
			currentPriceLabel: formatCurrencySafe(currentPriceValue),
			priceSuffix: resolveOfferPartySuffix(props.pricingMode, effectiveOffer?.rooms?.[0]?.passengers),
			searchIndex: normalizeMapSearchValue(`${point.hotelName} ${point.locationLabel}`),
			offerHref: resolveOfferHref({
				redirectionUrl: effectiveOffer?.link?.redirectionUrl,
				queryParam: effectiveOffer?.link?.queryParam,
				hostname: typeof window === "undefined" ? "" : window.location.hostname
			})
		};
	});
});

const sortedBaseMapPoints = computed(() => {
	return [...mapPoints.value].sort((left, right) => {
		return left.hotelName.localeCompare(right.hotelName, "ru-RU");
	});
});

const filteredMapPoints = computed(() => {
	const searchValue = normalizeMapSearchValue(hotelSearchQuery.value);

	if (!searchValue) {
		return sortedBaseMapPoints.value;
	}

	return sortedBaseMapPoints.value.filter((point) => {
		return point.searchIndex.includes(searchValue);
	});
});

const activeMapPoint = computed(() => {
	return filteredMapPoints.value.find((point) => point.hotelId === popupHotelId.value)
			?? mapPoints.value.find((point) => point.hotelId === popupHotelId.value)
			?? null;
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
	return Array.from({length: 5}, (_, index) => index < activeMapPointHotelStarCount.value);
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
const hasMapPoints = computed(() => filteredMapPoints.value.length > 0);

watch([mapPoints, filteredMapPoints], () => {
	if (activeHotelId.value && !filteredMapPoints.value.some((point) => point.hotelId === activeHotelId.value)) {
		activeHotelId.value = null;
	}

	if (popupHotelId.value && !filteredMapPoints.value.some((point) => point.hotelId === popupHotelId.value)) {
		popupHotelId.value = null;
	}
});

const { lastAutoLocationKey } = useOffreMapLocation({
	ymapsInitialized,
	map,
	points: filteredMapPoints,
	activeHotelId,
	mapSettings
});

function focusPoint(hotelId: string) {
	const point = filteredMapPoints.value.find((candidate) => candidate.hotelId === hotelId)
			?? mapPoints.value.find((candidate) => candidate.hotelId === hotelId);

	if (!point) {
		return;
	}

	activeHotelId.value = point.hotelId;

	if (!map.value) {
		return;
	}

	lastAutoLocationKey.value = `focus:${hotelId}`;
	map.value.setLocation({
		center: [point.longitude, point.latitude],
		duration: 500
	});
}

async function openPopupForHotel(hotelId: string) {
	popupHotelId.value = null;

	await nextTick();
	await new Promise<void>((resolve) => {
		requestAnimationFrame(() => resolve());
	});

	if (activeHotelId.value !== hotelId) {
		return;
	}

	popupHotelId.value = hotelId;
}

function handleMarkerToggle(hotelId: string) {
	if (activeHotelId.value === hotelId) {
		popupHotelId.value = null;
		activeHotelId.value = null;
		return;
	}

	focusPoint(hotelId);
	void openPopupForHotel(hotelId);
}

function closeOverlay() {
	popupHotelId.value = null;
	activeHotelId.value = null;
}

onMounted(async () => {
	createYmapsOptions({apikey: YMAPS_API_KEY});
	await initYmaps();
	ymapsInitialized.value = true;
});
</script>

<template>
	<section class="overflow-hidden rounded-2xl bg-white">
		<div
				v-if="!ymapsInitialized"
				class="px-4 py-12 text-center text-[14px] leading-[22px] text-[#8c8c8c]"
		>
			Загрузка карты...
		</div>

		<div
				v-else-if="!hasMapPoints"
				class="px-4 py-12 text-center text-[14px] leading-[22px] text-[#8c8c8c]"
		>
			Для выбранных офферов нет координат отелей
		</div>

		<div
				v-else
				class="relative min-h-[500px] overflow-hidden lg:h-[520px] lg:min-h-0"
		>
      <OffreMapSidebar
        :points="filteredMapPoints"
        :active-hotel-id="activeHotelId"
        :search-query="hotelSearchQuery"
        :map-offer-mode="mapOfferMode"
        :is-updating-prices="mapOfferLoading"
        @update:search-query="hotelSearchQuery = $event"
        @update:map-offer-mode="mapOfferMode = $event"
        @focus="focusPoint"
      />

			<YandexMap
					v-model="map"
					:settings="mapSettings"
					class="h-full w-full"
			>
				<YandexMapDefaultSchemeLayer/>
				<YandexMapDefaultFeaturesLayer/>

				<YandexMapOverlay
						v-if="activeMapOverlayModel && overlayBounds && !showBottomMapOverlay"
						:key="`overlay-${activeMapOverlayModel.point.key}`"
						:settings="{ bounds: overlayBounds }"
				>
					<OffreMapOverlayCard
							class="offre-map-overlay-card pointer-events-auto"
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
								v-for="point in filteredMapPoints"
								:key="point.key"
								:settings="{ coordinates: [point.longitude, point.latitude], zIndex: activeHotelId === point.hotelId ? 1100 : 1, properties: { currentPriceValue: point.currentPriceValue }, onClick: () => handleMarkerToggle(point.hotelId) }"
						>
							<OffreMapMarker
									:hotel-id="point.hotelId"
									:price-label="point.currentPriceLabel"
									:is-family-club="point.isFamilyClub"
									:is-elite-hotel="point.isEliteHotel"
									:is-open="activeHotelId === point.hotelId"
							/>
						</YandexMapMarker>
					</YandexMapClusterer>
			</YandexMap>

			<div
					v-if="activeMapOverlayModel && showBottomMapOverlay"
					class="pointer-events-none absolute inset-0 bottom-2 z-[60] flex items-end justify-center"
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

<style scoped>
:global(.offre-map-overlay-card) {
  box-shadow: none;
}

:global(.__ymap_overlay) {
  width: 0 !important;
  height: 0 !important;
  overflow: visible;
  pointer-events: none;
}

:global(.__ymap_overlay .offre-map-overlay-card) {
  width: min(420px, calc(100vw - 32px));
  transform: translate(18px, calc(-100% - 40px));
  pointer-events: auto;
}
</style>
