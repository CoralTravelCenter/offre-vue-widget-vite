<script setup lang="ts">
import { useDebounceFn } from "@vueuse/core";
import { ref, watch } from "vue";
import OffreTourTypeTabs from "offre/components/results/OffreTourTypeTabs.vue";
import type { OffreMapDisplayPoint } from "offre/components/results/offre-map.types";

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

function handleSearchInput(event: Event) {
  const nextValue = (event.target as HTMLInputElement).value;
  localSearchQuery.value = nextValue;
  emitSearchQuery(nextValue);
}
</script>

<template>
  <aside class="offre-map-sidebar absolute bottom-4 left-4 top-4 z-[30] hidden w-[300px] overflow-hidden rounded-[14px] border border-brand-border bg-brand-card/95 shadow-brand-popover backdrop-blur-[10px] lg:flex lg:flex-col">
    <div class="offre-map-sidebar__header grid gap-[10px] px-3 pb-2 pt-3">
      <div class="offre-map-sidebar__header-row flex items-center justify-between gap-3">
        <div class="offre-map-sidebar__title text-[15px] font-semibold leading-[18px] text-brand-foreground">Отели на карте</div>
        <div class="offre-map-sidebar__count rounded-full border border-brand-border bg-brand-muted px-2 py-[1px] text-[12px] leading-[18px] text-brand-muted-foreground">
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

    <label class="offre-map-sidebar__search block px-3 pb-[10px]">
      <input
        :value="localSearchQuery"
        type="text"
        placeholder="Поиск отеля"
        class="offre-map-sidebar__search-input block h-9 w-full appearance-none rounded-[8px] border border-brand-border bg-brand-muted px-[10px] text-[13px] leading-[18px] text-brand-foreground outline-none transition-[border-color,background-color] duration-150 ease-[ease] placeholder:text-brand-muted-foreground focus:border-brand-primary focus:bg-brand-card"
        @input="handleSearchInput"
      >
    </label>

    <div class="offre-map-sidebar__list grid min-h-0 flex-1 gap-1.5 overflow-auto px-3 pb-3">
      <button
        v-for="point in points"
        :key="`list-${point.key}`"
        type="button"
        :class="[
          'offre-map-sidebar__item grid w-full grid-cols-[56px_minmax(0,1fr)] items-stretch gap-2 rounded-[10px] border border-brand-border bg-brand-card/90 p-1.5 text-left transition-[border-color,background-color] duration-150 ease-[ease] hover:border-brand-primary hover:bg-brand-card',
          activeHotelId === point.hotelId ? 'offre-map-sidebar__item--active border-brand-primary bg-brand-card' : ''
        ]"
        @click="emit('focus', point.hotelId)"
      >
        <div
          v-if="point.imageUrl"
          class="offre-map-sidebar__item-media overflow-hidden rounded-[8px]"
        >
          <img
            :src="point.imageUrl"
            :alt="point.hotelName"
            class="offre-map-sidebar__item-image block h-full w-full object-cover"
          >
        </div>

        <div class="offre-map-sidebar__item-body grid min-w-0 gap-0.5">
          <div class="offre-map-sidebar__item-title overflow-hidden text-[13px] font-semibold leading-4 text-brand-foreground [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
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
  </aside>
</template>
