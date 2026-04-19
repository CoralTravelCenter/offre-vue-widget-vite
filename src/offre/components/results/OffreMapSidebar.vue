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
  <aside class="absolute bottom-4 left-4 top-4 z-[30] hidden w-[300px] overflow-hidden rounded-[14px] border border-[#f0f0f0] bg-[rgba(255,255,255,0.94)] shadow-[0_8px_24px_rgba(15,23,42,0.08)] backdrop-blur-[10px] lg:flex lg:flex-col">
    <div class="grid gap-[10px] px-3 pb-2 pt-3">
      <div class="flex items-center justify-between gap-3">
        <div class="text-[15px] font-semibold leading-[18px] text-[#262626]">Отели на карте</div>
        <div class="rounded-full border border-[#f0f0f0] bg-[#fafafa] px-2 py-[1px] text-[12px] leading-[18px] text-[#8c8c8c]">
          <template v-if="isUpdatingPrices && mapOfferMode === 'hotel'">обновляем...</template>
          <template v-else>{{ points.length }}</template>
        </div>
      </div>

      <OffreTourTypeTabs
        :model-value="mapOfferMode"
        class="[&_.offre-tour-type-tabs__trigger]:h-7 [&_.offre-tour-type-tabs__trigger]:px-2 [&_.offre-tour-type-tabs__trigger]:!text-[11px] [&_.offre-tour-type-tabs__trigger]:leading-4"
        @update:model-value="emit('update:mapOfferMode', $event)"
      />
    </div>

    <label class="block px-3 pb-[10px]">
      <input
        :value="localSearchQuery"
        type="text"
        placeholder="Поиск отеля"
        class="block h-9 w-full appearance-none rounded-[8px] border border-[#f0f0f0] bg-[#fafafa] px-[10px] text-[13px] leading-[18px] text-[#262626] outline-none transition-[border-color,background-color] duration-150 ease-[ease] placeholder:text-[#bfbfbf] focus:border-[rgb(74_158_212)] focus:bg-white"
        @input="handleSearchInput"
      >
    </label>

    <div class="grid min-h-0 flex-1 gap-1.5 overflow-auto px-3 pb-3">
      <button
        v-for="point in points"
        :key="`list-${point.key}`"
        type="button"
        :class="[
          'grid w-full grid-cols-[56px_minmax(0,1fr)] items-stretch gap-2 rounded-[10px] border border-[#f0f0f0] bg-[rgba(255,255,255,0.92)] p-1.5 text-left transition-[border-color,background-color] duration-150 ease-[ease] hover:border-[rgb(74_158_212)] hover:bg-white',
          activeHotelId === point.hotelId ? 'border-[rgb(74_158_212)] bg-white' : ''
        ]"
        @click="emit('focus', point.hotelId)"
      >
        <div
          v-if="point.imageUrl"
          class="overflow-hidden rounded-[8px]"
        >
          <img
            :src="point.imageUrl"
            :alt="point.hotelName"
            class="block h-full w-full object-cover"
          >
        </div>

        <div class="grid min-w-0 gap-0.5">
          <div class="overflow-hidden text-[13px] font-semibold leading-4 text-[#262626] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
            {{ point.hotelName }}
          </div>
          <div
            v-if="point.locationLabel"
            class="text-[11px] leading-[15px] text-[#8c8c8c]"
          >
            {{ point.locationLabel }}
          </div>
          <div
            v-if="point.currentPriceLabel"
            class="mt-px text-[14px] font-semibold leading-[18px] text-[var(--primary)]"
          >
            {{ point.currentPriceLabel }}
          </div>
        </div>
      </button>

      <div
        v-if="!points.length"
        class="px-0 py-6 text-center text-[14px] leading-5 text-[#8c8c8c]"
      >
        Ничего не найдено
      </div>
    </div>
  </aside>
</template>
