<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useEventListener } from "@vueuse/core";
import { useViewportBreakpoints } from "app/composables/useViewportBreakpoints";
import OffreCashbackBanner from "offre/components/results/OffreCashbackBanner.vue";
import type { CoralBonusInfo } from "offre/lib/coral-bonus";
import { Popover, PopoverContent, PopoverTrigger } from "ui/popover";

interface Props {
  cashbackInfo: CoralBonusInfo;
}

defineProps<Props>();

const { isLg, isXl, isXXL } = useViewportBreakpoints();
const isDesktopPopoverHoverMode = computed(() => {
  return isLg.value || isXl.value || isXXL.value;
});
const isCashbackPopoverOpen = ref(false);
let cashbackPopoverCloseTimer: ReturnType<typeof setTimeout> | null = null;

function clearCashbackPopoverCloseTimer() {
  if (!cashbackPopoverCloseTimer) {
    return;
  }

  clearTimeout(cashbackPopoverCloseTimer);
  cashbackPopoverCloseTimer = null;
}

function openCashbackPopover() {
  clearCashbackPopoverCloseTimer();
  isCashbackPopoverOpen.value = true;
}

function scheduleCashbackPopoverClose() {
  clearCashbackPopoverCloseTimer();
  cashbackPopoverCloseTimer = setTimeout(() => {
    isCashbackPopoverOpen.value = false;
    cashbackPopoverCloseTimer = null;
  }, 100);
}

function handleCashbackPopoverOpenChange(nextOpen: boolean) {
  isCashbackPopoverOpen.value = nextOpen;
}

function handleCashbackTriggerEnter() {
  if (!isDesktopPopoverHoverMode.value) {
    return;
  }

  openCashbackPopover();
}

function handleCashbackTriggerLeave() {
  if (!isDesktopPopoverHoverMode.value) {
    return;
  }

  scheduleCashbackPopoverClose();
}

function handleCashbackContentEnter() {
  if (!isDesktopPopoverHoverMode.value) {
    return;
  }

  openCashbackPopover();
}

function handleCashbackContentLeave() {
  if (!isDesktopPopoverHoverMode.value) {
    return;
  }

  scheduleCashbackPopoverClose();
}

watch(isDesktopPopoverHoverMode, (isDesktop) => {
  if (isDesktop) {
    return;
  }

  clearCashbackPopoverCloseTimer();
  isCashbackPopoverOpen.value = false;
});

useEventListener("scroll", () => {
  if (!isCashbackPopoverOpen.value) {
    return;
  }

  clearCashbackPopoverCloseTimer();
  isCashbackPopoverOpen.value = false;
}, { passive: true, capture: true });

onBeforeUnmount(() => {
  clearCashbackPopoverCloseTimer();
});
</script>

<template>
  <Popover
    :open="isCashbackPopoverOpen"
    @update:open="handleCashbackPopoverOpenChange"
  >
    <PopoverTrigger as-child>
      <button
        type="button"
        class="offre-cashback-popover m-0 cursor-pointer border-0 bg-transparent p-0 text-left text-inherit outline-none hover:brightness-[0.98] active:brightness-[0.95]"
        aria-label="Показать условия кешбэка CoralBonus"
        @mouseenter="handleCashbackTriggerEnter"
        @mouseleave="handleCashbackTriggerLeave"
      >
        <OffreCashbackBanner
          :amount-label="cashbackInfo.finalBonusLabel"
          class="offre-cashback-popover__banner"
        />
      </button>
    </PopoverTrigger>

    <PopoverContent
      side="top"
      align="center"
      class="offre-cashback-popover__content w-[min(var(--reka-popover-trigger-width),calc(100vw-32px))] max-w-[calc(100vw-32px)] rounded-xl border-0 bg-white px-3 py-0"
      @mouseenter="handleCashbackContentEnter"
      @mouseleave="handleCashbackContentLeave"
    >
      <div class="offre-cashback-popover__body text-foreground">
        <div class="offre-cashback-popover__list flex flex-col font-semibold">
          <div
            v-for="promo in cashbackInfo.listOfPromos"
            :key="`${promo.content_txt ?? 'promo'}-${promo.content_num ?? ''}`"
            class="offre-cashback-popover__row inline-flex items-center justify-between gap-4 border-b py-3 text-balance"
          >
            <span class="offre-cashback-popover__value text-left">
              {{ promo.content_num ?? "" }}
            </span>
            <a
              v-if="promo.content_link"
              :href="promo.content_link"
              class="offre-cashback-popover__description cursor-pointer text-right underline decoration-1 underline-offset-2 hover:text-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ promo.content_txt }}
            </a>
            <span
              v-else
              class="offre-cashback-popover__description text-left"
            >
              {{ promo.content_txt }}
            </span>
          </div>

          <div class="offre-cashback-popover__actions inline-flex items-center justify-between gap-4 py-3 text-balance">
            <div class="offre-cashback-popover__info text-left font-semibold">
              Для начисления бонусов, укажите номер карты в поле "Примечание к заказу"
            </div>
            <a
              href="https://coralbonus.ru/registration?promo=R3R5VO93GKG8N1PGQC1UP0G6EICQLRWEN3Z64WZGC4YBYIKHFJV55IND5O20WUJ"
              class="offre-cashback-popover__activate inline-flex h-8 shrink-0 items-center justify-center rounded-lg bg-primary px-3 py-1.5 text-primary-foreground hover:bg-primary/90 active:bg-primary/80"
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
.offre-cashback-popover {
  transition: filter 0.15s ease;
}

.offre-cashback-popover__content {
  box-shadow: var(--offre-shadow-popover);
}

.offre-cashback-popover__list {
  font-size: var(--offre-text-meta);
}

.offre-cashback-popover__row {
  border-color: var(--offre-border-popover-row);
}

.offre-cashback-popover__description,
.offre-cashback-popover__activate {
  transition: color 0.15s ease, background-color 0.15s ease;
}

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
