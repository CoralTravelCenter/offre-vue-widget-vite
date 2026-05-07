<script setup lang="ts">
import { ref } from "vue";
import { useEventListener } from "@vueuse/core";
import OffreCashbackBanner from "offre/components/results/OffreCashbackBanner.vue";
import type { CoralBonusInfo } from "offre/lib/coral-bonus";
import { Popover, PopoverContent, PopoverTrigger } from "ui/popover";

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
        class="offre-cashback-popover cashback m-0 cursor-pointer border-0 bg-transparent p-0 text-left text-inherit outline-none transition-[filter] hover:brightness-[0.98] active:brightness-[0.95]"
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
      class="offre-cashback-popover__content w-[min(var(--reka-popover-trigger-width),calc(100vw-32px))] max-w-[calc(100vw-32px)] rounded-xl border-0 bg-brand-card px-3 py-0 shadow-brand-popover"
    >
      <div class="offre-cashback-popover__body text-[length:var(--brand-text-meta)] leading-[var(--brand-leading-meta)] text-brand-foreground">
        <div class="offre-cashback-popover__list promos-grid flex flex-col font-normal">
          <div
            v-for="promo in cashbackInfo.listOfPromos"
            :key="`${promo.content_txt ?? 'promo'}-${promo.content_num ?? ''}`"
            class="offre-cashback-popover__row inline-flex items-center justify-between gap-4 border-b border-[var(--brand-border-popover-row)] py-3 text-balance"
          >
            <span class="offre-cashback-popover__value value text-left">
              {{ promo.content_num ?? "" }}
            </span>
            <a
              v-if="promo.content_link"
              :href="promo.content_link"
              class="offre-cashback-popover__description description cursor-pointer text-right underline decoration-1 underline-offset-2 transition-[color,background-color] hover:text-brand-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ promo.content_txt }}
            </a>
            <span
              v-else
              class="offre-cashback-popover__description description text-left transition-[color,background-color]"
            >
              {{ promo.content_txt }}
            </span>
          </div>

          <div class="offre-cashback-popover__actions info-action inline-flex items-center justify-between gap-4 py-3 text-balance">
            <div class="offre-cashback-popover__info info text-left font-normal">
              Для начисления бонусов, укажите номер карты в поле "Примечание к заказу"
            </div>
            <a
              href="https://coralbonus.ru/registration?promo=R3R5VO93GKG8N1PGQC1UP0G6EICQLRWEN3Z64WZGC4YBYIKHFJV55IND5O20WUJ"
              class="offre-cashback-popover__activate action inline-flex h-8 shrink-0 items-center justify-center rounded-lg bg-brand-primary px-3 py-1.5 text-brand-primary-foreground transition-[color,background-color] hover:bg-brand-primary/90 active:bg-brand-primary/80"
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

<style scoped lang="scss">
.offre-cashback-popover__row {
  @media (min-width: 768px) and (max-width: 1279px) {
    align-content: start;
    display: grid;
    gap: 12px;
    grid-template-columns: auto minmax(0, 1fr);
  }
}

.offre-cashback-popover__actions {
  @media (min-width: 768px) and (max-width: 1279px) {
    align-items: center;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
  }
}

.offre-cashback-popover__description,
.offre-cashback-popover__info {
  @media (min-width: 768px) and (max-width: 1279px) {
    min-width: 0;
    text-wrap: balance;
  }
}
</style>
