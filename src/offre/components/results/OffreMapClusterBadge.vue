<script setup lang="ts">
interface Props {
  count: number;
  minPrice?: string;
  maxPrice?: string;
}

withDefaults(defineProps<Props>(), {
  minPrice: "",
  maxPrice: ""
});
</script>

<template>
  <div class="group relative z-20 block h-[60px] w-[60px] -translate-x-1/2 -translate-y-1/2 cursor-pointer leading-none">
    <div class="absolute inset-[5px] z-[1] inline-flex h-[50px] w-[50px] items-center justify-center rounded-full bg-white text-[24px] font-medium text-black shadow-[0_0_0_5px_rgba(0,0,0,0.06)]">
      {{ count }}
    </div>

    <div
      v-if="minPrice || maxPrice"
      class="pointer-events-none absolute left-[calc(100%+3px)] top-1/2 z-30 grid -translate-y-1/2 -translate-x-[6px] gap-[2px] rounded-[12px] border border-[rgba(15,23,42,0.08)] bg-[rgba(255,255,255,0.96)] px-[10px] py-2 text-nowrap opacity-0 shadow-[0_10px_24px_rgba(15,23,42,0.12)] backdrop-blur-[10px] transition-[opacity,transform] duration-150 ease-[ease] group-hover:translate-x-0 group-hover:opacity-100"
    >
      <span
        v-if="minPrice"
        class="text-[11px] leading-[15px] text-[#262626]"
      >
        от {{ minPrice }}
      </span>
      <span
        v-if="maxPrice"
        class="text-[11px] leading-[15px] text-[#262626]"
      >
        до {{ maxPrice }}
      </span>
    </div>
  </div>
</template>
