<script setup lang="ts">
import { MapPinIcon } from "lucide-vue-next";
import { computed } from "vue";

interface Props {
  priceLabel?: string;
  isFamilyClub?: boolean;
  isEliteHotel?: boolean;
  isOpen?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  priceLabel: "",
  isFamilyClub: false,
  isEliteHotel: false,
  isOpen: false
});

const emit = defineEmits<{
  toggle: [];
}>();

const markerToneClass = computed(() => {
  if (props.isFamilyClub) {
    return "offre-map-marker__placemark--family";
  }

  if (props.isEliteHotel) {
    return "offre-map-marker__placemark--elite";
  }

  return "offre-map-marker__placemark--default";
});
</script>

<template>
  <div
    :class="[
      'offre-map-marker relative h-[37px] w-7 -translate-x-1/2 -translate-y-full text-[14px] leading-none',
      isOpen ? 'offre-map-marker--open' : ''
    ]"
  >
    <button
      type="button"
      :class="['offre-map-marker__placemark absolute inset-0 cursor-pointer border-0 bg-transparent p-0', markerToneClass]"
      @click.stop="emit('toggle')"
    >
      <MapPinIcon class="offre-map-marker__icon" />
    </button>

    <div
      v-if="priceLabel && !isOpen"
      class="offre-map-marker__price-badge"
    >
      {{ priceLabel }}
    </div>
  </div>
</template>

<style scoped lang="scss">
.offre-map-marker__placemark {
  align-items: center;
  filter: drop-shadow(0 4px 10px rgba(15, 23, 42, 0.16));
  display: inline-flex;
  height: 37px;
  justify-content: center;
  transition: transform 0.15s ease;
  width: 28px;
}

.offre-map-marker__placemark--default {
  color: #1677ff;
}

.offre-map-marker__placemark--family {
  color: #13c2c2;
}

.offre-map-marker__placemark--elite {
  color: #262626;
}

.offre-map-marker__icon {
  fill: rgba(255, 255, 255, 0.9);
  height: 37px;
  stroke: currentColor;
  stroke-width: 2;
  width: 28px;
}

.offre-map-marker__price-badge {
  backdrop-filter: blur(4px);
  background: rgba(255, 255, 255, 0.92);
  border-radius: 999px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.16);
  color: #262626;
  left: 30px;
  font-size: 12px;
  line-height: 1;
  padding: 5px 7px;
  position: absolute;
  text-wrap: nowrap;
  top: 2px;
}
</style>
