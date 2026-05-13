<script setup lang="ts">
import { ref } from "vue";
import { useEventListener } from "@vueuse/core";
import OffreCashbackBanner from "@/offre/components/results/OffreCashbackBanner/OffreCashbackBanner.vue";
import type { CoralBonusInfo } from "@/offre/lib/coral-bonus";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Props {
  cashbackInfo: CoralBonusInfo;
}

defineProps<Props>();

const isCashbackPopoverOpen = ref(false);

function handleCashbackPopoverOpenChange(nextOpen: boolean) {
  isCashbackPopoverOpen.value = nextOpen;
}

useEventListener("scroll", () => {
  if (!isCashbackPopoverOpen.value) {
    return;
  }

  isCashbackPopoverOpen.value = false;
}, { passive: true, capture: true });
</script>

<template>
  <Popover
    :open="isCashbackPopoverOpen"
    @update:open="handleCashbackPopoverOpenChange"
  >
    <PopoverTrigger as-child>
      <button
        type="button"
        class="offre-cashback-popover cashback"
        aria-label="Показать условия кешбэка CoralBonus"
      >
        <OffreCashbackBanner
          :amount-label="cashbackInfo.finalBonusLabel"
          class="offre-cashback-popover__banner"
        />
      </button>
    </PopoverTrigger>

    <PopoverContent
      size="brand"
      side="top"
      align="center"
      class="offre-cashback-popover__content"
    >
      <div class="offre-cashback-popover__body">
        <div class="offre-cashback-popover__list">
          <div
            v-for="promo in cashbackInfo.listOfPromos"
            :key="`${promo.content_txt ?? 'promo'}-${promo.content_num ?? ''}`"
            class="offre-cashback-popover__row"
          >
            <span class="offre-cashback-popover__value value">
              {{ promo.content_num ?? "" }}
            </span>
            <a
              v-if="promo.content_link"
              :href="promo.content_link"
              class="offre-cashback-popover__description offre-cashback-popover__description--link description"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ promo.content_txt }}
            </a>
            <span
              v-else
              class="offre-cashback-popover__description description"
            >
              {{ promo.content_txt }}
            </span>
          </div>

          <div class="offre-cashback-popover__actions info-action">
            <div class="offre-cashback-popover__info info">
              Для начисления бонусов, укажите номер карты в поле "Примечание к заказу"
            </div>
            <a
              href="https://coralbonus.ru/registration?promo=R3R5VO93GKG8N1PGQC1UP0G6EICQLRWEN3Z64WZGC4YBYIKHFJV55IND5O20WUJ"
              class="offre-cashback-popover__activate action"
              target="_blank"
              rel="noopener noreferrer"
            >
              Активировать
            </a>
          </div>
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>

<style scoped src="./OffreCashbackPopover.scss" lang="scss"></style>
