<script setup lang="ts">
import { computed } from "vue";
import mapMarkerDefault from "./icons/map-marker-default.svg";
import mapMarkerElite from "./icons/map-marker-elite.svg";
import mapMarkerFamily from "./icons/map-marker-family.svg";

interface Props {
  hotelId: string;
  priceLabel?: string;
  isFamilyClub?: boolean;
  isEliteHotel?: boolean;
  isOpen?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  hotelId: "",
  priceLabel: "",
  isFamilyClub: false,
  isEliteHotel: false,
  isOpen: false
});
const emit = defineEmits<{
  toggle: [];
}>();

const markerIconSrc = computed(() => {
  if (props.isFamilyClub) {
    return mapMarkerFamily;
  }

  if (props.isEliteHotel) {
    return mapMarkerElite;
  }

  return mapMarkerDefault;
});
</script>

<template>
  <div
    :data-map-hotel-id="hotelId"
    class="relative h-[29px] w-[22px] -translate-x-1/2 -translate-y-full cursor-pointer text-[14px] leading-none"
  >
    <button
      type="button"
      class="absolute inset-0 h-full w-full cursor-pointer border-0 bg-transparent p-0"
      @click.stop="emit('toggle')"
    >
      <img
        :src="markerIconSrc"
        alt=""
        class="pointer-events-none block h-[29px] w-[22px] [filter:drop-shadow(0_3px_7px_rgba(15,23,42,0.16))]"
      >
    </button>

    <div
      v-if="priceLabel && !isOpen"
      class="pointer-events-none absolute left-[24px] top-0 rounded-full bg-[rgba(255,255,255,0.92)] px-[6px] py-[4px] text-[11px] leading-none whitespace-nowrap text-[#262626] shadow-[0_1px_2px_rgba(0,0,0,0.16)] backdrop-blur-[4px]"
    >
      {{ priceLabel }}
    </div>
  </div>
</template>
