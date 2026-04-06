<script setup lang="ts">
import { useQueryClient } from "@tanstack/vue-query";
import { refDebounced, useMediaQuery } from "@vueuse/core";
import { computed, onMounted, reactive, ref, shallowRef, watch } from "vue";
import { hotelPriceSearchList } from "offre/api/client";
import type { B2COffer, B2CProduct } from "offre/api/types";
import OffreMapMarker from "offre/components/results/OffreMapMarker.vue";
import { buildHotelOfferSearchCriterias } from "offre/lib/hotel-offer";
import type { NormalizedOffreWidgetOptions } from "offre/lib/payload";
import {
  formatCurrencySafe,
  stripEnglishBracketFragments,
  resolveHotelImageUrl,
  resolveOfferHref,
  resolveOfferPriceValue,
  resolveOfferPartySuffix
} from "offre/lib/product-offer";
import { offreQueryConfig } from "offre/query/config";
import { offreQueryKeys } from "offre/query/keys";
import {
  createYmapsOptions,
  getBoundsFromCoords,
  getLocationFromBounds,
  initYmaps,
  YandexMap,
  YandexMapClusterer,
  YandexMapDefaultFeaturesLayer,
  YandexMapDefaultSchemeLayer,
  YandexMapMarker
} from "vue-yandex-maps";

const YMAPS_API_KEY = "49de5080-fb39-46f1-924b-dee5ddbad2f1";
const MAP_HOTEL_OFFERS_CONCURRENCY = 6;

const props = defineProps<{
  products: B2CProduct[];
  pricingMode?: unknown;
  searchOptions: NormalizedOffreWidgetOptions;
}>();

function normalizeCoordinate(value: number | string | undefined) {
  const normalizedValue = Number(value);
  return Number.isFinite(normalizedValue) ? normalizedValue : null;
}

function getPrimaryOffer(product: B2CProduct) {
  return Array.isArray(product.offers) && product.offers.length > 0 ? product.offers[0] : null;
}

function getPassengersCount(offer: B2COffer | null) {
  return offer?.rooms?.reduce((count, room) => {
    return count + (Array.isArray(room?.passengers) ? room.passengers.length : 0);
  }, 0) ?? 0;
}

function getClusterPriceRange(features: Array<{ properties?: { currentPriceValue?: number } }>) {
  const values = features
    .map((feature) => Number(feature?.properties?.currentPriceValue))
    .filter((value) => Number.isFinite(value) && value > 0);

  if (!values.length) {
    return { min: "", max: "" };
  }

  return {
    min: formatCurrencySafe(Math.min(...values)),
    max: formatCurrencySafe(Math.max(...values))
  };
}

function normalizeSearchValue(value: string) {
  return value.trim().toLocaleLowerCase("ru-RU");
}

function buildPointsLocationKey(
  points: Array<{ hotelId: string; longitude: number; latitude: number }>
) {
  return points
    .map((point) => `${point.hotelId}:${point.longitude.toFixed(4)},${point.latitude.toFixed(4)}`)
    .join("|");
}

async function runConcurrentTasks<TValue>(
  tasks: Array<() => Promise<TValue>>,
  concurrency: number
) {
  const results: TValue[] = new Array(tasks.length);
  let cursor = 0;

  async function worker() {
    while (cursor < tasks.length) {
      const taskIndex = cursor;
      cursor += 1;
      results[taskIndex] = await tasks[taskIndex]();
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(Math.max(concurrency, 1), tasks.length || 1) }, () => worker())
  );

  return results;
}

const ymapsInitialized = ref(false);
const queryClient = useQueryClient();
const map = shallowRef();
const clusterer = shallowRef();
const activeHotelId = ref<string | null>(null);
const hotelSearchQuery = ref("");
const debouncedHotelSearchQuery = refDebounced(hotelSearchQuery, 140);
const mapOfferMode = ref<"package" | "hotel">("package");
const hotelOffersByHotelId = shallowRef(new Map<string, B2COffer | null>());
const mapOfferLoading = ref(false);
const lastAutoLocationKey = ref("");
const showBottomMapOverlay = useMediaQuery("(max-width: 1023px)");
const mapSettings = reactive({
  location: {
    center: [37.617644, 55.755819] as [number, number],
    zoom: 9
  },
  controls: []
});

const baseMapPoints = computed(() => {
  return props.products
    .map((product, index) => {
      const hotel = product.hotel ?? {};
      const coordinates = hotel.coordinates ?? null;
      const latitude = normalizeCoordinate(coordinates?.latitude);
      const longitude = normalizeCoordinate(coordinates?.longitude);
      const packageOffer = getPrimaryOffer(product);
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
        packageOffer,
        isFamilyClub: Boolean(hotel.sunFamilyClub || hotel.coralFamilyClub),
        isEliteHotel: Boolean(hotel.eliteHotel)
      };
    })
    .filter((point): point is NonNullable<typeof point> => point !== null);
});

const mapPoints = computed(() => {
  return baseMapPoints.value.map((point) => {
    const effectiveOffer = mapOfferMode.value === "hotel"
      ? hotelOffersByHotelId.value.get(point.hotelId) ?? point.packageOffer
      : point.packageOffer;
    const passengersCount = getPassengersCount(effectiveOffer);
    const stayNights = Number(effectiveOffer?.stayNights) || 0;
    const currentPriceValue = resolveOfferPriceValue(
      effectiveOffer?.price?.amount,
      props.pricingMode,
      passengersCount,
      stayNights
    );

    return {
      ...point,
      currentPriceValue,
      currentPriceLabel: formatCurrencySafe(currentPriceValue),
      priceSuffix: resolveOfferPartySuffix(props.pricingMode, effectiveOffer?.rooms?.[0]?.passengers),
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
  const searchValue = normalizeSearchValue(debouncedHotelSearchQuery.value);

  if (!searchValue) {
    return sortedBaseMapPoints.value;
  }

  return sortedBaseMapPoints.value.filter((point) => {
    return normalizeSearchValue(`${point.hotelName} ${point.locationLabel}`).includes(searchValue);
  });
});

const activeMapPoint = computed(() => {
  return filteredMapPoints.value.find((point) => point.hotelId === activeHotelId.value)
    ?? mapPoints.value.find((point) => point.hotelId === activeHotelId.value)
    ?? null;
});
const mapPointsSelected = computed(() => {
  return activeMapPoint.value ? [activeMapPoint.value] : [];
});
const mapPointsExceptSelected = computed(() => {
  if (!activeHotelId.value) {
    return filteredMapPoints.value;
  }

  return filteredMapPoints.value.filter((point) => point.hotelId !== activeHotelId.value);
});

const hasMapPoints = computed(() => filteredMapPoints.value.length > 0);

watch([mapPoints, filteredMapPoints], () => {
  if (activeHotelId.value && !mapPoints.value.some((point) => point.hotelId === activeHotelId.value)) {
    activeHotelId.value = null;
  }
});

watch([filteredMapPoints, map], async ([points], _prev, onCleanup) => {
  let cancelled = false;
  onCleanup(() => {
    cancelled = true;
  });

  if (!ymapsInitialized.value || !map.value || points.length === 0) {
    return;
  }

  if (activeHotelId.value && points.some((point) => point.hotelId === activeHotelId.value)) {
    return;
  }

  if (points.length === 1) {
    const nextLocationKey = `single:${points[0].hotelId}`;

    if (lastAutoLocationKey.value === nextLocationKey) {
      return;
    }

    lastAutoLocationKey.value = nextLocationKey;
    mapSettings.location = {
      center: [points[0].longitude, points[0].latitude],
      zoom: 10
    };
    return;
  }

  const nextLocationKey = `bounds:${buildPointsLocationKey(points)}`;

  if (lastAutoLocationKey.value === nextLocationKey) {
    return;
  }

  const nextLocation = await getLocationFromBounds({
    bounds: getBoundsFromCoords(points.map((point) => [point.longitude, point.latitude])),
    map: map.value,
    roundZoom: true,
    comfortZoomLevel: true
  });

  if (cancelled || !map.value) {
    return;
  }

  lastAutoLocationKey.value = nextLocationKey;
  map.value.setLocation({
    ...nextLocation,
    duration: 750
  });
}, { immediate: true });

watch(
  [() => props.products, () => props.searchOptions, mapOfferMode],
  async ([products, searchOptions, offerMode], _previous, onCleanup) => {
    let cancelled = false;
    onCleanup(() => {
      cancelled = true;
    });

    if (offerMode !== "hotel") {
      mapOfferLoading.value = false;
      return;
    }

    const nextMap = new Map(hotelOffersByHotelId.value);
    const tasks = products.flatMap((product, index) => {
      const hotelId = String(product.hotel?.id ?? product.hotel?.name ?? index);

      if (nextMap.has(hotelId)) {
        return [];
      }

      const searchCriterias = buildHotelOfferSearchCriterias({
        hotel: product.hotel,
        packageOffer: getPrimaryOffer(product),
        searchOptions
      });

      if (!searchCriterias) {
        nextMap.set(hotelId, null);
        return [];
      }

      return [async () => {
        try {
          const hotelOffer = await queryClient.fetchQuery({
            queryKey: offreQueryKeys.hotelOffer(searchCriterias),
            staleTime: offreQueryConfig.hotelOffer.staleTime,
            gcTime: offreQueryConfig.hotelOffer.gcTime,
            queryFn: async () => {
              const response = await hotelPriceSearchList(searchCriterias);
              return response.result.products?.[0]?.offers?.[0] ?? null;
            }
          });

          return [hotelId, hotelOffer] as const;
        } catch {
          return [hotelId, null] as const;
        }
      }];
    });

    if (!tasks.length) {
      hotelOffersByHotelId.value = nextMap;
      mapOfferLoading.value = false;
      return;
    }

    mapOfferLoading.value = true;
    const nextEntries = await runConcurrentTasks(tasks, MAP_HOTEL_OFFERS_CONCURRENCY);

    if (cancelled) {
      return;
    }

    nextEntries.forEach(([hotelId, hotelOffer]) => {
      nextMap.set(hotelId, hotelOffer);
    });

    hotelOffersByHotelId.value = nextMap;
    mapOfferLoading.value = false;
  },
  { immediate: true }
);

function toggleMarker(hotelId: string) {
  activeHotelId.value = activeHotelId.value === hotelId ? null : hotelId;
}

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
    zoom: 12,
    duration: 500
  });
}

function closeOverlay() {
  activeHotelId.value = null;
}

onMounted(async () => {
  createYmapsOptions({ apikey: YMAPS_API_KEY });
  await initYmaps();
  ymapsInitialized.value = true;
});
</script>

<template>
  <section class="offre-map-view rounded-2xl bg-white">
    <div
      v-if="!ymapsInitialized"
      class="offre-map-view__empty"
    >
      Загрузка карты...
    </div>

    <div
      v-else-if="!hasMapPoints"
      class="offre-map-view__empty"
    >
      Для выбранных офферов нет координат отелей
    </div>

    <div
      v-else
      class="offre-map-view__canvas"
    >
      <aside class="offre-map-view__panel">
        <div class="offre-map-view__panel-head">
          <div class="offre-map-view__panel-heading">
            <div class="offre-map-view__panel-title">Отели на карте</div>
            <div class="offre-map-view__panel-count">
              <template v-if="mapOfferLoading && mapOfferMode === 'hotel'">обновляем...</template>
              <template v-else>{{ filteredMapPoints.length }}</template>
            </div>
          </div>

          <div class="offre-map-view__mode-switch" role="tablist" aria-label="Режим цены на карте">
            <button
              type="button"
              :class="[
                'offre-map-view__mode-button',
                mapOfferMode === 'package' ? 'is-active' : ''
              ]"
              @click="mapOfferMode = 'package'"
            >
              Тур
            </button>
            <button
              type="button"
              :class="[
                'offre-map-view__mode-button',
                mapOfferMode === 'hotel' ? 'is-active' : ''
              ]"
              @click="mapOfferMode = 'hotel'"
            >
              Отель
            </button>
          </div>
        </div>

        <label class="offre-map-view__search">
          <input
            v-model="hotelSearchQuery"
            type="text"
            placeholder="Поиск отеля"
            class="offre-map-view__search-input"
          >
        </label>

        <div class="offre-map-view__hotel-list">
          <button
            v-for="point in filteredMapPoints"
            :key="`list-${point.key}`"
            type="button"
            :class="[
              'offre-map-view__hotel-card',
              activeHotelId === point.hotelId ? 'is-active' : ''
            ]"
            @click="focusPoint(point.hotelId)"
          >
            <div
              v-if="point.imageUrl"
              class="offre-map-view__hotel-card-media"
            >
              <img
                :src="point.imageUrl"
                :alt="point.hotelName"
                class="offre-map-view__hotel-card-image"
              >
            </div>

            <div class="offre-map-view__hotel-card-main">
              <div class="offre-map-view__hotel-card-title">{{ point.hotelName }}</div>
              <div
                v-if="point.locationLabel"
                class="offre-map-view__hotel-card-location"
              >
                {{ point.locationLabel }}
              </div>
              <div
                v-if="point.currentPriceLabel"
                class="offre-map-view__hotel-card-price"
              >
                {{ point.currentPriceLabel }}
              </div>
            </div>
          </button>

          <div
            v-if="!filteredMapPoints.length"
            class="offre-map-view__panel-empty"
          >
            Ничего не найдено
          </div>
        </div>
      </aside>

      <YandexMap
        v-model="map"
        :settings="mapSettings"
        class="offre-map-view__map"
      >
        <YandexMapDefaultSchemeLayer />
        <YandexMapDefaultFeaturesLayer />

        <YandexMapClusterer
          v-model="clusterer"
          :grid-size="90"
          zoom-on-cluster-click
        >
          <template #cluster="{ length, clusterer }">
            <div class="offre-map-view__cluster">
              <div class="offre-map-view__cluster-hud">
                {{ length }}
              </div>
              <template
                v-for="(range, idx) in [getClusterPriceRange(clusterer.features)]"
                :key="idx"
              >
                <div
                  v-if="range.min || range.max"
                  class="offre-map-view__cluster-pricing"
                >
                  <span
                    v-if="range.min"
                    class="offre-map-view__cluster-pricing-row"
                  >
                    от {{ range.min }}
                  </span>
                  <span
                    v-if="range.max"
                    class="offre-map-view__cluster-pricing-row"
                  >
                    до {{ range.max }}
                  </span>
                </div>
              </template>
            </div>
          </template>

        <YandexMapMarker
            v-for="point in mapPointsExceptSelected"
            :key="point.key"
            :settings="{ coordinates: [point.longitude, point.latitude], zIndex: 1, properties: { currentPriceValue: point.currentPriceValue } }"
          >
            <OffreMapMarker
              :price-label="point.currentPriceLabel"
              :is-family-club="point.isFamilyClub"
              :is-elite-hotel="point.isEliteHotel"
              @toggle="toggleMarker(point.hotelId)"
            />
          </YandexMapMarker>
        </YandexMapClusterer>

        <YandexMapMarker
          v-for="point in mapPointsSelected"
          :key="`selected-${point.key}`"
          :settings="{ coordinates: [point.longitude, point.latitude], zIndex: 100, properties: { currentPriceValue: point.currentPriceValue } }"
        >
          <OffreMapMarker
            :price-label="point.currentPriceLabel"
            :is-family-club="point.isFamilyClub"
            :is-elite-hotel="point.isEliteHotel"
            is-open
            @toggle="toggleMarker(point.hotelId)"
          />

          <div
            v-if="!showBottomMapOverlay"
            class="offre-map-view__overlay"
          >
            <button
              type="button"
              class="offre-map-view__overlay-close"
              aria-label="Закрыть"
              @click.stop="closeOverlay"
            >
              ×
            </button>
            <div class="offre-map-view__overlay-content">
              <div
                v-if="point.imageUrl"
                class="offre-map-view__overlay-media"
              >
                <img
                  :src="point.imageUrl"
                  :alt="point.hotelName"
                  class="offre-map-view__overlay-image"
                >
              </div>

              <div class="offre-map-view__overlay-main">
                <div class="offre-map-view__overlay-title">{{ point.hotelName }}</div>
                <div
                  v-if="point.locationLabel"
                  class="offre-map-view__overlay-location"
                >
                  {{ point.locationLabel }}
                </div>
                <div
                  v-if="point.currentPriceLabel"
                  class="offre-map-view__overlay-price"
                >
                  {{ point.currentPriceLabel }}
                </div>
                <div
                  v-if="point.currentPriceLabel && point.priceSuffix"
                  class="offre-map-view__overlay-suffix"
                >
                  {{ point.priceSuffix }}
                </div>
                <a
                  v-if="point.offerHref && point.offerHref !== '#'"
                  :href="point.offerHref"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="offre-map-view__overlay-link"
                >
                  Открыть оффер
                </a>
              </div>
            </div>
          </div>
        </YandexMapMarker>
      </YandexMap>

      <div
        v-if="activeMapPoint && showBottomMapOverlay"
        class="offre-map-view__mobile-overlay-wrap"
      >
        <div class="offre-map-view__overlay offre-map-view__overlay--mobile">
          <button
            type="button"
            class="offre-map-view__overlay-close"
            aria-label="Закрыть"
            @click.stop="closeOverlay"
          >
            ×
          </button>
          <div class="offre-map-view__overlay-content">
            <div
              v-if="activeMapPoint.imageUrl"
              class="offre-map-view__overlay-media"
            >
              <img
                :src="activeMapPoint.imageUrl"
                :alt="activeMapPoint.hotelName"
                class="offre-map-view__overlay-image"
              >
            </div>

            <div class="offre-map-view__overlay-main">
              <div class="offre-map-view__overlay-title">{{ activeMapPoint.hotelName }}</div>
              <div
                v-if="activeMapPoint.locationLabel"
                class="offre-map-view__overlay-location"
              >
                {{ activeMapPoint.locationLabel }}
              </div>
              <div
                v-if="activeMapPoint.currentPriceLabel"
                class="offre-map-view__overlay-price"
              >
                {{ activeMapPoint.currentPriceLabel }}
              </div>
              <div
                v-if="activeMapPoint.currentPriceLabel && activeMapPoint.priceSuffix"
                class="offre-map-view__overlay-suffix"
              >
                {{ activeMapPoint.priceSuffix }}
              </div>
              <a
                v-if="activeMapPoint.offerHref && activeMapPoint.offerHref !== '#'"
                :href="activeMapPoint.offerHref"
                target="_blank"
                rel="noopener noreferrer"
                class="offre-map-view__overlay-link"
              >
                Открыть оффер
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.offre-map-view {
  overflow: hidden;
}

.offre-map-view__canvas {
  min-height: 500px;
  overflow: hidden;
  position: relative;
}

.offre-map-view__map {
  height: 100%;
  width: 100%;
}

.offre-map-view__panel {
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid #f0f0f0;
  border-radius: 14px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
  display: none;
  bottom: 16px;
  left: 16px;
  max-width: 300px;
  overflow: hidden;
  position: absolute;
  top: 16px;
  width: 23%;
  z-index: 30;
}

.offre-map-view__panel-head {
  display: grid;
  gap: 10px;
  padding: 12px 12px 8px;
}

.offre-map-view__panel-heading {
  align-items: center;
  display: flex;
  gap: 12px;
  justify-content: space-between;
}

.offre-map-view__panel-title {
  color: #262626;
  font-size: 15px;
  font-weight: 600;
  line-height: 18px;
}

.offre-map-view__panel-count {
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 999px;
  color: #8c8c8c;
  font-size: 12px;
  line-height: 18px;
  padding: 1px 8px;
}

.offre-map-view__mode-switch {
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  overflow: hidden;
  padding: 2px;
}

.offre-map-view__mode-button {
  background: transparent;
  border: 0;
  color: #262626;
  cursor: pointer;
  font-size: 12px;
  font-weight: 400;
  height: 28px;
  line-height: 16px;
  padding: 0 8px;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.offre-map-view__mode-button.is-active {
  background: var(--primary);
  border-radius: 6px;
  color: #fff;
}

.offre-map-view__search {
  display: block;
  padding: 0 12px 10px;
}

.offre-map-view__search-input {
  appearance: none;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  color: #262626;
  display: block;
  font-size: 13px;
  height: 36px;
  line-height: 18px;
  outline: none;
  padding: 0 10px;
  transition: border-color 0.15s ease, background-color 0.15s ease;
  width: 100%;
}

.offre-map-view__search-input::placeholder {
  color: #bfbfbf;
}

.offre-map-view__search-input:focus {
  background: #fff;
  border-color: rgb(74 158 212);
}

.offre-map-view__hotel-list {
  display: grid;
  gap: 6px;
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 0 12px 12px;
}

.offre-map-view__hotel-card {
  align-items: stretch;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid #f0f0f0;
  border-radius: 10px;
  cursor: pointer;
  display: grid;
  gap: 8px;
  grid-template-columns: 56px minmax(0, 1fr);
  padding: 6px;
  text-align: left;
  transition: border-color 0.15s ease, background-color 0.15s ease;
  width: 100%;
}

.offre-map-view__hotel-card:hover,
.offre-map-view__hotel-card.is-active {
  border-color: rgb(74 158 212);
  background: #fff;
}

.offre-map-view__hotel-card-media {
  border-radius: 8px;
  overflow: hidden;
}

.offre-map-view__hotel-card-image {
  display: block;
  height: 100%;
  object-fit: cover;
  width: 100%;
}

.offre-map-view__hotel-card-main {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.offre-map-view__hotel-card-title {
  color: #262626;
  font-size: 13px;
  font-weight: 600;
  line-height: 16px;
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.offre-map-view__hotel-card-location {
  color: #8c8c8c;
  font-size: 11px;
  line-height: 15px;
}

.offre-map-view__hotel-card-price {
  color: #1677ff;
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  margin-top: 1px;
}

.offre-map-view__panel-empty {
  color: #8c8c8c;
  font-size: 14px;
  line-height: 20px;
  padding: 24px 0 8px;
  text-align: center;
}

@media (min-width: 1024px) {
  .offre-map-view__canvas {
    height: 520px;
    min-height: 0;
  }

  .offre-map-view__panel {
    display: block;
    display: flex;
    flex-direction: column;
  }
}

.offre-map-view__cluster {
  cursor: pointer;
  display: block;
  font-size: 14px;
  height: 60px;
  line-height: 1;
  position: relative;
  transform: translate(-50%, -50%);
  width: 60px;
  z-index: 20;
}

.offre-map-view__cluster-hud {
  align-items: center;
  background: #fff;
  border: 0;
  border-radius: 999px;
  box-shadow: 0 0 0 5px rgba(0, 0, 0, 0.06);
  color: #000;
  display: inline-flex;
  font-size: 24px;
  font-weight: 500;
  height: 50px;
  inset: 5px;
  justify-content: center;
  position: absolute;
  width: 50px;
  z-index: 1;
}

.offre-map-view__cluster-pricing {
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 12px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
  display: grid;
  gap: 2px;
  left: calc(100% + 3px);
  opacity: 0;
  padding: 8px 10px;
  pointer-events: none;
  position: absolute;
  text-wrap: nowrap;
  top: 50%;
  transform: translateY(-50%) translateX(-6px);
  transition: opacity 0.15s ease, transform 0.15s ease;
  z-index: 30;
}

.offre-map-view__cluster:hover .offre-map-view__cluster-pricing {
  opacity: 1;
  transform: translateY(-50%) translateX(0);
}

.offre-map-view__cluster-pricing-row {
  color: #262626;
  font-size: 11px;
  line-height: 15px;
}

.offre-map-view__empty {
  color: #8c8c8c;
  font-size: 14px;
  line-height: 22px;
  padding: 48px 16px;
  text-align: center;
}

.offre-map-view__overlay {
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 14px;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.14);
  display: grid;
  left: 18px;
  min-width: 280px;
  padding: 8px;
  position: absolute;
  top: -8px;
}

.offre-map-view__mobile-overlay-wrap {
  align-items: flex-end;
  bottom: 8px;
  display: flex;
  inset: 0;
  justify-content: center;
  pointer-events: none;
  position: absolute;
  z-index: 20;
}

.offre-map-view__overlay--mobile {
  left: auto;
  max-width: calc(100% - 16px);
  pointer-events: auto;
  position: relative;
  top: auto;
  width: min(360px, 100%);
}

.offre-map-view__overlay-close {
  align-items: center;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  font-size: 14px;
  height: 20px;
  justify-content: center;
  padding: 0;
  position: absolute;
  right: 8px;
  top: 8px;
  width: 20px;
}

.offre-map-view__overlay-title {
  color: #262626;
  font-size: 15px;
  font-weight: 600;
  line-height: 18px;
  padding-right: 20px;
}

.offre-map-view__overlay-location,
.offre-map-view__overlay-suffix {
  color: #8c8c8c;
  font-size: 12px;
  line-height: 18px;
}

.offre-map-view__overlay-price {
  color: #1677ff;
  font-size: 18px;
  font-weight: 600;
  line-height: 24px;
  margin-top: 2px;
}

.offre-map-view__overlay-link {
  color: #1677ff;
  font-size: 12px;
  line-height: 18px;
  margin-top: 4px;
  text-decoration: none;
}

.offre-map-view__overlay-content {
  display: grid;
  gap: 8px;
  grid-template-columns: 108px minmax(0, 1fr);
}

.offre-map-view__overlay-main {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.offre-map-view__overlay-media {
  border-radius: 10px;
  overflow: hidden;
}

.offre-map-view__overlay-image {
  display: block;
  height: 100%;
  object-fit: cover;
  width: 100%;
}
</style>
const MAP_HOTEL_OFFERS_CONCURRENCY = 6;
