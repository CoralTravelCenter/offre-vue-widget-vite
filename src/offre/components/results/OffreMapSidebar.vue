<script setup lang="ts">
import {useDebounceFn} from "@vueuse/core";
import {computed, ref, watch} from "vue";
import OffreTourTypeTabs from "offre/components/results/OffreTourTypeTabs.vue";
import type {OffreMapDisplayPoint} from "offre/components/results/offre-map.types";
import {ScrollArea} from "ui/scroll-area";
import {Skeleton} from "ui/skeleton";

interface Props {
	points: OffreMapDisplayPoint[];
	activeHotelId: string | null;
	searchQuery: string;
	mapOfferMode: "package" | "hotel";
	isUpdatingPrices?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	activeHotelId: null,
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

const skeletonItemsCount = computed(() => {
	return Math.max(3, Math.min(props.points.length || 0, 6));
});

function handleSearchInput(event: Event) {
	const nextValue = (event.target as HTMLInputElement).value;
	localSearchQuery.value = nextValue;
	emitSearchQuery(nextValue);
}

function getSidebarItemClass(hotelId: string) {
	return [
		"offre-map-sidebar__item h-fit self-stretch grid w-full min-w-0 grid-cols-[56px_minmax(0,1fr)] items-stretch gap-2 rounded-[10px] border border-brand-border bg-brand-card/90 p-1.5 text-left transition-[border-color,background-color] duration-150 ease-[ease] hover:border-brand-primary hover:bg-brand-card",
		props.activeHotelId === hotelId
				? "offre-map-sidebar__item--active border-brand-primary bg-brand-card"
				: "offre-map-sidebar__item--default"
	];
}
</script>

<template>
	<aside
			class="offre-map-sidebar absolute bottom-4 left-4 top-4 z-20 hidden w-[300px] overflow-hidden rounded-[14px] border border-brand-border bg-brand-card/95 p-4 pb-0 shadow-brand-popover backdrop-blur-[10px] lg:flex lg:flex-col">
		<div class="offre-map-sidebar__top mb-[10px] grid gap-[10px]">
			<div class="offre-map-sidebar__header grid gap-[10px]">
				<div class="offre-map-sidebar__header-row flex items-center justify-between gap-3">
					<div class="offre-map-sidebar__title text-[15px] font-normal leading-[18px] text-brand-foreground">Отели на
						карте
					</div>
					<div
							class="offre-map-sidebar__count rounded-full border border-brand-border bg-brand-muted px-2 py-px text-[12px] leading-[18px] text-brand-muted-foreground">
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

			<label class="offre-map-sidebar__search block">
				<span
						class="offre-map-sidebar__search-shell flex h-9 items-center rounded-lg border border-brand-border bg-[var(--brand-map-search-surface,var(--brand-muted))] px-[10px] transition-[border-color,background-color] duration-150 ease-[ease] focus-within:border-brand-primary focus-within:bg-brand-card"
				>
					<input
							:value="localSearchQuery"
							type="text"
							placeholder="Поиск отеля"
							class="offre-map-sidebar__search-input block h-full w-full appearance-none border-0 bg-transparent p-0 text-[13px] leading-[18px] text-brand-foreground outline-none placeholder:text-brand-muted-foreground"
							@input="handleSearchInput"
					>
				</span>
			</label>
		</div>

		<ScrollArea class="offre-map-sidebar__list min-h-0 flex-1">
			<div class="flex w-full flex-col items-stretch gap-2">
				<template v-if="isUpdatingPrices">
					<div
							v-for="index in skeletonItemsCount"
							:key="`sidebar-skeleton-${index}`"
							class="grid w-full min-w-0 self-stretch grid-cols-[56px_minmax(0,1fr)] gap-2 rounded-[10px] border border-brand-border bg-brand-card/90 p-1.5"
							aria-hidden="true"
					>
						<Skeleton class="h-14 w-14 rounded-lg bg-[var(--brand-skeleton-base)]"/>
						<div class="grid min-w-0 content-start gap-0.5">
							<div class="grid gap-1">
								<Skeleton class="h-3.5 w-[88%] rounded-sm bg-[var(--brand-skeleton-base)]"/>
								<Skeleton class="h-3.5 w-[62%] rounded-sm bg-[var(--brand-skeleton-base)]"/>
							</div>
							<Skeleton class="mt-0.5 h-[11px] w-[52%] rounded-sm bg-[var(--brand-skeleton-base)]"/>
							<Skeleton class="mt-0.75 h-[18px] w-[44%] rounded-sm bg-[var(--brand-skeleton-base)]"/>
						</div>
					</div>
				</template>

				<button
						v-else
						v-for="point in points"
						:key="`list-${point.key}`"
						type="button"
						:class="getSidebarItemClass(point.hotelId)"
						@click="emit('focus', point.hotelId)"
				>
					<div
							v-if="point.imageUrl"
							class="offre-map-sidebar__item-media min-w-[50px] overflow-hidden rounded-lg"
					>
						<img
								:src="point.imageUrl"
								:alt="point.hotelName"
								class="offre-map-sidebar__item-image block h-full w-full object-cover"
						>
					</div>

					<div class="offre-map-sidebar__item-body grid min-w-0 gap-0.5">
						<div
								class="offre-map-sidebar__item-title overflow-hidden text-[14px] font-semibold leading-4 text-brand-foreground [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
							{{ point.hotelName }}
						</div>
						<div
								v-if="point.locationLabel"
								class="offre-map-sidebar__item-location text-[11px] leading-[15px] text-brand-muted-foreground"
						>
							{{ point.locationLabel }}
						</div>
						<div
								v-if="point.currentPriceLabel"
								class="offre-map-sidebar__item-price mt-px text-[14px] font-semibold leading-[18px] text-brand-primary"
						>
							{{ point.currentPriceLabel }}
						</div>
					</div>
				</button>

				<div
						v-if="!points.length"
						class="offre-map-sidebar__empty px-0 py-6 text-center text-[14px] leading-5 text-brand-muted-foreground"
				>
					Ничего не найдено
				</div>
			</div>
		</ScrollArea>
	</aside>
</template>
