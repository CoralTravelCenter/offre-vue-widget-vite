<script setup lang="ts">
import OffreCashbackPopover from "offre/components/results/OffreCashbackPopover.vue";
import OffreTourTypeTabs from "offre/components/results/OffreTourTypeTabs.vue";
import type { CoralBonusInfo } from "offre/lib/coral-bonus";
import type { OffreTourType } from "offre/types";
import { Button } from "ui/button";
import { Skeleton } from "ui/skeleton";

interface Props {
	disabled?: boolean;
	loading?: boolean;
	isHotelOnly?: boolean;
	oldPriceLabel?: string;
	currentPriceLabel?: string;
	priceSuffix?: string;
	discountPercent?: number;
	hasOfferHref?: boolean;
	offerHref?: string;
	cashbackInfo?: CoralBonusInfo | null;
}

withDefaults(defineProps<Props>(), {
	disabled: false,
	loading: false,
	isHotelOnly: false,
	oldPriceLabel: "",
	currentPriceLabel: "",
	priceSuffix: "",
	discountPercent: 0,
	hasOfferHref: false,
	offerHref: "#",
	cashbackInfo: null
});

const modelValue = defineModel<OffreTourType>({ required: true });
</script>

<template>
  <div
    class="offre-offer-pricing-panel mt-auto flex min-w-0 flex-col gap-2 overflow-visible border-t border-brand-border pt-2"
  >
    <OffreTourTypeTabs
      v-model="modelValue"
      :disabled="disabled"
      :is-hotel-only="isHotelOnly"
    />

    <template v-if="loading">
      <div class="offre-offer-pricing-panel__tour-info offre-offer-pricing-panel__tour-info--loading">
        <div class="offre-offer-pricing-panel__pricing offre-offer-pricing-panel__pricing--loading relative overflow-visible">
          <Skeleton class="offre-offer-pricing-panel__loading-caption"/>
          <Skeleton class="offre-offer-pricing-panel__loading-old-price"/>
          <Skeleton class="offre-offer-pricing-panel__loading-current-price"/>
          <Skeleton class="offre-offer-pricing-panel__loading-price-suffix"/>
          <Skeleton class="offre-offer-pricing-panel__loading-discount"/>
        </div>

        <Skeleton class="offre-offer-pricing-panel__loading-cashback"/>

        <Button
          size="brand"
          class="offre-offer-pricing-panel__action w-full"
          disabled
        >
          Загрузка...
        </Button>
      </div>
    </template>

    <template v-else>
      <div class="offre-offer-pricing-panel__tour-info">
        <div class="offre-offer-pricing-panel__pricing relative overflow-visible">
          <div class="offre-offer-pricing-panel__caption text-brand-muted-foreground">
            цена от:
          </div>

          <div
            v-if="oldPriceLabel"
            class="offre-offer-pricing-panel__old-price text-brand-muted-foreground decoration-brand-destructive line-through"
          >
            {{ oldPriceLabel }}
          </div>

          <div class="offre-offer-pricing-panel__price-row flex flex-wrap items-baseline gap-1">
            <div class="offre-offer-pricing-panel__current-price font-semibold text-brand-primary">
              {{ currentPriceLabel || "Цена по запросу" }}
            </div>
          </div>

          <div
            v-if="currentPriceLabel && priceSuffix"
            class="offre-offer-pricing-panel__price-suffix text-brand-primary"
          >
            {{ priceSuffix }}
          </div>

          <div
            v-if="discountPercent"
            class="offre-offer-pricing-panel__discount-badge absolute bottom-0 right-0 grid h-6 place-content-center leading-none text-white"
          >
            <span class="offre-offer-pricing-panel__discount-badge-text">{{ discountPercent }}% Скидка</span>
          </div>
        </div>

        <OffreCashbackPopover
          v-if="cashbackInfo"
          :cashback-info="cashbackInfo"
        />

        <Button
          v-if="hasOfferHref && !disabled"
          as="a"
          size="brand"
          :href="offerHref"
          class="offre-offer-pricing-panel__action w-full"
          rel="noopener noreferrer"
          target="_blank"
        >
          Выбрать
        </Button>

        <Button
          v-else
          size="brand"
          class="offre-offer-pricing-panel__action w-full"
          disabled
        >
          {{ disabled ? "Загрузка..." : "Недоступно" }}
        </Button>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.offre-offer-pricing-panel {
  --offre-offer-pricing-skeleton-fill: color-mix(in srgb, var(--brand-foreground) 10%, transparent);
}

.offre-offer-pricing-panel__discount-badge {
  overflow: hidden;
  position: absolute;
  top: 50%;
  right: 0;
  background: var(--brand-discount);
  border-radius: var(--brand-radius-badge);
  font-size: var(--brand-text-meta);
  transform: translateY(-50%);
  z-index: 1;
  padding-left: 12px;
  padding-right: 16px;

  &::after {
    content: "";
    position: absolute;
    top: calc(100% - 6px);
    right: 0;
    width: 8px;
    height: 6px;
    background: inherit;
    clip-path: polygon(100% 0, 0 0, 0 100%);
  }
}

.offre-offer-pricing-panel__pricing {
  padding-right: 108px;
}

.offre-offer-pricing-panel__discount-badge-text {
  display: block;
  white-space: nowrap;
}

.offre-offer-pricing-panel__caption {
  font-size: var(--brand-text-caption);
  line-height: 0.875rem;
}

.offre-offer-pricing-panel__old-price {
  font-size: var(--brand-text-body);
  line-height: var(--brand-leading-control);
}

.offre-offer-pricing-panel__price-row,
.offre-offer-pricing-panel__current-price,
.offre-offer-pricing-panel__price-suffix {
  line-height: var(--brand-leading-title);
}

.offre-offer-pricing-panel__current-price {
  font-size: var(--brand-text-price);
}

.offre-offer-pricing-panel__price-suffix {
  font-size: var(--brand-text-price-suffix);
  line-height: 1rem;
  margin-top: 2px;
  white-space: nowrap;
}

.offre-offer-pricing-panel__loading-caption,
.offre-offer-pricing-panel__loading-old-price,
.offre-offer-pricing-panel__loading-current-price,
.offre-offer-pricing-panel__loading-price-suffix,
.offre-offer-pricing-panel__loading-discount,
.offre-offer-pricing-panel__loading-cashback {
  background-color: var(--offre-offer-pricing-skeleton-fill);
}

.offre-offer-pricing-panel__loading-caption {
  height: 12px;
  width: 52px;
}

.offre-offer-pricing-panel__loading-old-price {
  height: 18px;
  margin-top: 8px;
  width: 72px;
}

.offre-offer-pricing-panel__loading-current-price {
  height: 38px;
  margin-top: 8px;
  width: 68%;
}

.offre-offer-pricing-panel__loading-price-suffix {
  height: 12px;
  margin-top: 2px;
  width: 44%;
}

.offre-offer-pricing-panel__loading-discount {
  border-radius: var(--brand-radius-badge);
  height: 28px;
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 88px;
}

.offre-offer-pricing-panel__loading-cashback {
  border-radius: var(--brand-radius-badge);
  height: 50px;
  width: 100%;
}

.offre-offer-pricing-panel__action {
  border-radius: var(--brand-radius-button);
  font-size: var(--brand-text-button);
  height: 48px;
  line-height: var(--brand-leading-button);
  padding: 12px 16px;
}

.offre-offer-pricing-panel__tour-info {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 10px;
}

.offre-offer-pricing-panel {
  @media (min-width: 1024px) {
    margin-top: 0;
    height: 100%;
    position: relative;
    justify-content: space-between;
    border-top: 0;
    padding-top: 0;
    padding-left: 12px;

    &::before {
      content: "";
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 1px;
      background-color: var(--brand-border);
    }
  }
}

.offre-offer-pricing-panel__tour-info {
  @media (min-width: 1024px) {
    justify-content: flex-end;
  }
}

</style>
