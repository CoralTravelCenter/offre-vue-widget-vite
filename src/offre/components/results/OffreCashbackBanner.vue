<script setup lang="ts">
import { CircleHelpIcon } from "lucide-vue-next";

interface Props {
  amountLabel?: string;
}

withDefaults(defineProps<Props>(), {
  amountLabel: "9 800 ₽"
});
</script>

<template>
  <div class="offre-cashback-banner rounded-[4px] bg-[#FFF1CC] p-2">
    <div class="offre-cashback-banner__content flex items-center justify-between gap-[6px]">
      <div class="offre-cashback-banner__body min-w-0">
        <div class="offre-cashback-banner__title text-[14px] font-medium leading-4 text-[#2B2B2B]">
          Кешбэк до {{ amountLabel }}
        </div>
        <div class="offre-cashback-banner__subtitle mt-px flex items-end gap-1 text-[12px] leading-[14px] text-[#2B2B2B]">
          <span class="offre-cashback-banner__subtitle-text">на карту CoralBonus</span>
          <CircleHelpIcon class="offre-cashback-banner__hint mb-px h-3 w-3 shrink-0 text-[#8C8C8C]" />
        </div>
      </div>

      <div class="offre-cashback-banner__card shrink-0">
        <img
          src="https://b2ccdn.coral.ru/content/cb-card-offre-vue.png"
          alt="CoralBonus"
          class="offre-cashback-banner__card-image block h-auto w-[55px] rounded-[8px] object-contain"
        >
      </div>
    </div>
  </div>
</template>
