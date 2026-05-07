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

function getActionClass(state: "default" | "loading" | "disabled") {
	return [
		"offre-offer-pricing-panel__action do-choose h-12 w-full rounded-[var(--brand-radius-button)] px-4 py-3 text-[length:var(--brand-text-button)] leading-[var(--brand-leading-button)]",
		state === "default"
			? "offre-offer-pricing-panel__action--default bg-brand-primary text-brand-primary-foreground hover:bg-brand-primary/90"
			: "offre-offer-pricing-panel__action--disabled bg-brand-primary text-brand-primary-foreground hover:bg-brand-primary/90 disabled:bg-brand-primary disabled:text-brand-primary-foreground"
	];
}
</script>

<template>
  <div class="offre-offer-pricing-panel pricing mt-auto flex min-w-0 flex-col gap-2 overflow-visible border-t border-brand-border pt-2 lg:relative lg:mt-0 lg:h-full lg:justify-between lg:border-t-0 lg:pt-0 lg:pl-3 lg:before:absolute lg:before:inset-y-0 lg:before:left-0 lg:before:w-px lg:before:bg-brand-border lg:before:content-['']">
    <OffreTourTypeTabs
      v-model="modelValue"
      :disabled="disabled"
      :is-hotel-only="isHotelOnly"
      size="compact"
      class="tour-type"
    />

    <template v-if="loading">
      <div class="offre-offer-pricing-panel__tour-info tour-info flex flex-1 flex-col gap-[10px] lg:justify-end">
        <div class="offre-offer-pricing-panel__pricing offre-offer-pricing-panel__pricing--loading price-discount relative overflow-visible pr-[108px]">
          <Skeleton class="offre-offer-pricing-panel__loading-caption h-[10px] w-[52px] bg-[color-mix(in_srgb,var(--brand-foreground)_10%,transparent)]"/>
          <Skeleton class="offre-offer-pricing-panel__loading-old-price mt-2 h-3 w-[72px] bg-[color-mix(in_srgb,var(--brand-foreground)_10%,transparent)]"/>
          <Skeleton class="offre-offer-pricing-panel__loading-current-price mt-2 h-7 w-[68%] bg-[color-mix(in_srgb,var(--brand-foreground)_10%,transparent)]"/>
          <Skeleton class="offre-offer-pricing-panel__loading-price-suffix mt-[2px] h-3 w-[44%] bg-[color-mix(in_srgb,var(--brand-foreground)_10%,transparent)]"/>
          <Skeleton class="offre-offer-pricing-panel__loading-discount absolute right-0 top-1/2 h-7 w-[88px] -translate-y-1/2 rounded-[var(--brand-radius-badge)] bg-[color-mix(in_srgb,var(--brand-foreground)_10%,transparent)]"/>
        </div>

        <Skeleton class="offre-offer-pricing-panel__loading-cashback h-[50px] w-full rounded-[var(--brand-cashback-banner-radius)] bg-[color-mix(in_srgb,var(--brand-foreground)_10%,transparent)]"/>

        <Button
          size="brand"
          :class="getActionClass('loading')"
          disabled
        >
          Загрузка...
        </Button>
      </div>
    </template>

    <template v-else>
      <div class="offre-offer-pricing-panel__tour-info tour-info flex flex-1 flex-col gap-[10px] lg:justify-end">
        <div class="offre-offer-pricing-panel__pricing price-discount relative overflow-visible pr-[108px]">
          <div class="offre-offer-pricing-panel__price price">
            <div class="offre-offer-pricing-panel__caption from-wording text-[length:var(--brand-text-caption)] leading-[0.875rem] text-brand-muted-foreground">
              цена от:
            </div>

            <div
              v-if="oldPriceLabel"
              class="offre-offer-pricing-panel__old-price list-price text-[length:var(--brand-text-meta)] leading-[var(--brand-leading-meta)] text-brand-muted-foreground line-through decoration-brand-destructive"
            >
              {{ oldPriceLabel }}
            </div>

            <div class="offre-offer-pricing-panel__price-row flex flex-wrap items-baseline gap-1 leading-[var(--brand-leading-title)]">
              <div class="offre-offer-pricing-panel__current-price final-price text-[length:var(--brand-text-price)] font-semibold leading-[var(--brand-leading-title)] text-brand-primary">
                {{ currentPriceLabel || "Цена по запросу" }}
              </div>
            </div>

            <div
              v-if="currentPriceLabel && priceSuffix"
              class="offre-offer-pricing-panel__price-suffix mt-[2px] whitespace-nowrap text-[length:var(--brand-text-price-suffix)] leading-4 text-brand-primary"
            >
              {{ priceSuffix }}
            </div>

            <div
              v-if="discountPercent"
              class="offre-offer-pricing-panel__discount-badge discount absolute right-[-17px] top-1/2 grid h-6 -translate-y-1/2 place-content-center rounded-[4px_4px_0_4px] bg-brand-discount px-2 py-1 text-[length:var(--brand-text-meta)] leading-[var(--brand-leading-meta)] text-brand-primary-foreground after:absolute after:right-0 after:top-full after:h-[6px] after:w-2 after:bg-[var(--brand-discount-fold)] after:content-[''] after:[clip-path:polygon(100%_0,0_0,0_100%)]"
            >
              <span class="offre-offer-pricing-panel__discount-badge-text">{{ discountPercent }}% Скидка</span>
            </div>
          </div>
        </div>

        <OffreCashbackPopover
          v-if="cashbackInfo"
          :cashback-info="cashbackInfo"
          class="cashback"
        />

        <Button
          v-if="hasOfferHref && !disabled"
          as="a"
          size="brand"
          :href="offerHref"
          :class="getActionClass('default')"
          rel="noopener noreferrer"
          target="_blank"
        >
          Выбрать
        </Button>

        <Button
          v-else
          size="brand"
          :class="getActionClass('disabled')"
          disabled
        >
          {{ disabled ? "Загрузка..." : "Недоступно" }}
        </Button>
      </div>
    </template>
  </div>
</template>
