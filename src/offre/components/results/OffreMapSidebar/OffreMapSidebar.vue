<script setup lang="ts">
import {useDebounceFn} from "@vueuse/core";
import {ref, watch} from "vue";
import OffreTourTypeTabs from "@/offre/components/results/OffreTourTypeTabs/OffreTourTypeTabs.vue";
import type {OffreMapDisplayPoint} from "@/offre/lib/offre-map";
import {ScrollArea} from "@/components/ui/scroll-area";
import {Skeleton} from "@/components/ui/skeleton";

interface Props {
	points: OffreMapDisplayPoint[];
	activeHotelId: string | null;
	searchQuery: string;
	mapOfferMode: "package" | "hotel";
	isLoadingBase?: boolean;
	isUpdatingPrices?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	activeHotelId: null,
	isLoadingBase: false,
	isUpdatingPrices: false
});

const emit = defineEmits<{
	"update:searchQuery": [value: string];
	"update:mapOfferMode": [value: "package" | "hotel"];
	focus: [hotelId: string];
}>();

const localSearchQuery = ref(props.searchQuery);

watch(() => props.searchQuery, (nextValue) => {
	if (nextValue !== localSearchQuery.value) {
		localSearchQuery.value = nextValue;
	}
});

const emitSearchQuery = useDebounceFn((value: string) => {
	emit("update:searchQuery", value);
}, 250);

function handleSearchInput(event: Event) {
	const nextValue = (event.target as HTMLInputElement).value;
	localSearchQuery.value = nextValue;
	emitSearchQuery(nextValue);
}

function getSidebarItemClass(hotelId: string) {
	return [
		"offre-map-sidebar__item",
		props.activeHotelId === hotelId
			? "offre-map-sidebar__item--active"
			: "offre-map-sidebar__item--default"
	];
}
</script>

<template>
	<aside class="offre-map-sidebar">
		<div class="offre-map-sidebar__top">
			<div
				v-if="props.isLoadingBase"
				class="offre-map-sidebar__header offre-map-sidebar__header--loading"
				aria-hidden="true"
			>
				<div class="offre-map-sidebar__header-row">
					<Skeleton class="offre-map-sidebar__header-title-skeleton"/>
					<Skeleton class="offre-map-sidebar__header-count-skeleton"/>
				</div>

				<Skeleton class="offre-map-sidebar__tabs-skeleton"/>
			</div>

			<div
				v-else
				class="offre-map-sidebar__header"
			>
				<div class="offre-map-sidebar__header-row">
					<div class="offre-map-sidebar__title">
						Отели на карте
					</div>
					<div class="offre-map-sidebar__count">
						<template v-if="isUpdatingPrices && mapOfferMode === 'hotel'">обновляем...</template>
						<template v-else>{{ points.length }}</template>
					</div>
				</div>

				<OffreTourTypeTabs
					:model-value="mapOfferMode"
					class="offre-map-sidebar__offer-mode"
					size="compact"
					@update:model-value="emit('update:mapOfferMode', $event)"
				/>
			</div>

			<Skeleton
				v-if="props.isLoadingBase"
				class="offre-map-sidebar__search-skeleton"
				aria-hidden="true"
			/>
			<label
				v-else
				class="offre-map-sidebar__search"
			>
				<span class="offre-map-sidebar__search-shell">
					<input
						:value="localSearchQuery"
						type="text"
						placeholder="Поиск отеля"
						class="offre-map-sidebar__search-input"
						@input="handleSearchInput"
					>
				</span>
			</label>
		</div>

		<ScrollArea class="offre-map-sidebar__list">
			<div class="offre-map-sidebar__list-content">
				<template v-if="props.isLoadingBase">
					<div
						v-for="index in 4"
						:key="`sidebar-skeleton-${index}`"
						class="offre-map-sidebar__skeleton-item"
						aria-hidden="true"
					>
						<Skeleton class="offre-map-sidebar__skeleton-media"/>
						<div class="offre-map-sidebar__skeleton-body">
							<div class="offre-map-sidebar__skeleton-title-group">
								<Skeleton class="offre-map-sidebar__skeleton-title offre-map-sidebar__skeleton-title--primary"/>
								<Skeleton class="offre-map-sidebar__skeleton-title offre-map-sidebar__skeleton-title--secondary"/>
							</div>
							<Skeleton class="offre-map-sidebar__skeleton-meta"/>
							<Skeleton class="offre-map-sidebar__skeleton-price"/>
						</div>
					</div>
				</template>

				<button
					v-for="point in points"
					v-else
					:key="`list-${point.key}`"
					type="button"
					:class="getSidebarItemClass(point.hotelId)"
					@click="emit('focus', point.hotelId)"
				>
					<div
						v-if="point.imageUrl"
						class="offre-map-sidebar__item-media"
					>
						<img
							:src="point.imageUrl"
							:alt="point.hotelName"
							class="offre-map-sidebar__item-image"
						>
					</div>

					<div class="offre-map-sidebar__item-body">
						<div class="offre-map-sidebar__item-title">
							{{ point.hotelName }}
						</div>
						<div
							v-if="point.locationLabel"
							class="offre-map-sidebar__item-location"
						>
							{{ point.locationLabel }}
						</div>
						<div
							v-if="point.isLoadingPrice"
							class="offre-map-sidebar__item-price-shell"
						>
							<Skeleton class="offre-map-sidebar__skeleton-price offre-map-sidebar__skeleton-price--inline"/>
						</div>
						<div
							v-else-if="point.currentPriceLabel"
							class="offre-map-sidebar__item-price"
						>
							{{ point.currentPriceLabel }}
						</div>
					</div>
				</button>

				<div
					v-if="!points.length"
					class="offre-map-sidebar__empty"
				>
					Ничего не найдено
				</div>
			</div>
		</ScrollArea>
	</aside>
</template>

<style scoped src="./OffreMapSidebar.scss" lang="scss"></style>
