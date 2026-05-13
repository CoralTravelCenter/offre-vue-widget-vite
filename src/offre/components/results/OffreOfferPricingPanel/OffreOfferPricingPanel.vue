<script setup lang="ts">
import OffreCashbackPopover from "@/offre/components/results/OffreCashbackPopover/OffreCashbackPopover.vue";
import OffreTourTypeTabs from "@/offre/components/results/OffreTourTypeTabs/OffreTourTypeTabs.vue";
import type { CoralBonusInfo } from "@/offre/lib/coral-bonus";
import type { OffreTourType } from "@/offre/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

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
		"offre-offer-pricing-panel__action",
		state === "default"
			? "offre-offer-pricing-panel__action--default"
			: "offre-offer-pricing-panel__action--disabled"
	];
}
</script>

<template>
  <div class="offre-offer-pricing-panel pricing">
    <OffreTourTypeTabs
      v-model="modelValue"
      :disabled="disabled"
      :is-hotel-only="isHotelOnly"
      size="compact"
      class="tour-type"
    />

    <template v-if="loading">
      <div class="offre-offer-pricing-panel__tour-info tour-info">
        <div class="offre-offer-pricing-panel__pricing offre-offer-pricing-panel__pricing--loading price-discount">
          <Skeleton class="offre-offer-pricing-panel__loading-caption"/>
          <Skeleton class="offre-offer-pricing-panel__loading-old-price"/>
          <Skeleton class="offre-offer-pricing-panel__loading-current-price"/>
          <Skeleton class="offre-offer-pricing-panel__loading-price-suffix"/>
          <Skeleton class="offre-offer-pricing-panel__loading-discount"/>
        </div>

        <Skeleton class="offre-offer-pricing-panel__loading-cashback"/>

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
      <div class="offre-offer-pricing-panel__tour-info tour-info">
        <div class="offre-offer-pricing-panel__pricing price-discount">
          <div class="offre-offer-pricing-panel__price price">
            <div class="offre-offer-pricing-panel__caption from-wording">
              цена от:
            </div>

            <div
              v-if="oldPriceLabel"
              class="offre-offer-pricing-panel__old-price list-price"
            >
              {{ oldPriceLabel }}
            </div>

            <div class="offre-offer-pricing-panel__price-row">
              <div class="offre-offer-pricing-panel__current-price final-price">
                {{ currentPriceLabel || "Цена по запросу" }}
              </div>
            </div>

            <div
              v-if="currentPriceLabel && priceSuffix"
              class="offre-offer-pricing-panel__price-suffix"
            >
              {{ priceSuffix }}
            </div>

            <div
              v-if="discountPercent"
              class="offre-offer-pricing-panel__discount-badge discount"
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

<style scoped src="./OffreOfferPricingPanel.scss" lang="scss"></style>
