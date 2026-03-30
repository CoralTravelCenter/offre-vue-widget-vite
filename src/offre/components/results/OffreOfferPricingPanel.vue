<script setup lang="ts">
import {computed, onBeforeUnmount, ref, watch} from "vue";
import {useEventListener} from "@vueuse/core";
import {useViewportBreakpoints} from "app/composables/useViewportBreakpoints";
import OffreCashbackBanner from "offre/components/results/OffreCashbackBanner.vue";
import OffreTourTypeTabs from "offre/components/results/OffreTourTypeTabs.vue";
import type {CoralBonusInfo} from "offre/lib/coral-bonus";
import type {OffreTourType} from "offre/types";
import {Popover, PopoverContent, PopoverTrigger} from "ui/popover";
import {Button} from "ui/button";

interface Props {
	disabled?: boolean;
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
	isHotelOnly: false,
	oldPriceLabel: "",
	currentPriceLabel: "",
	priceSuffix: "",
	discountPercent: 0,
	hasOfferHref: false,
	offerHref: "#",
	cashbackInfo: null
});

const modelValue = defineModel<OffreTourType>({required: true});
const {isLg, isXl, isXXL} = useViewportBreakpoints();
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
}, {passive: true, capture: true});

onBeforeUnmount(() => {
	clearCashbackPopoverCloseTimer();
});
</script>

<template>
	<div
			class="offre-offer-pricing-panel mt-auto flex min-w-0 flex-col gap-2 overflow-visible border-t border-border pt-2 lg:mt-0 lg:h-full lg:justify-end lg:border-t-0 lg:border-l lg:border-border lg:pl-3 lg:pt-0">
		<OffreTourTypeTabs
				v-model="modelValue"
				:disabled="disabled"
				:is-hotel-only="isHotelOnly"
		/>

		<div class="offre-offer-pricing-panel__pricing relative overflow-visible">
			<div class="offre-offer-pricing-panel__caption text-[10px] leading-3.5 text-muted-foreground">
				цена от:
			</div>

			<div
					v-if="oldPriceLabel"
					class="offre-offer-pricing-panel__old-price text-[14px] leading-5.5 text-muted-foreground decoration-destructive line-through"
			>
				{{ oldPriceLabel }}
			</div>

			<div class="offre-offer-pricing-panel__price-row flex flex-wrap items-baseline gap-1 leading-7">
				<div class="offre-offer-pricing-panel__current-price text-[24px] font-semibold leading-7 text-primary">
					{{ currentPriceLabel || "Цена по запросу" }}
				</div>
				<span
						v-if="currentPriceLabel && priceSuffix"
						class="offre-offer-pricing-panel__price-suffix text-[20px] font-light leading-7 text-primary"
				>
          {{ priceSuffix }}
        </span>
			</div>

			<div
					v-if="discountPercent"
					class="offre-offer-pricing-panel__discount-badge absolute bottom-0 right-0 grid h-6 place-content-center rounded-[4px_4px_0_4px] bg-[#52C41A] px-3 text-[12px] leading-none text-white lg:right-1 lg:translate-x-5.5"
			>
				{{ discountPercent }}% Скидка
			</div>
		</div>

		<Popover
				v-if="cashbackInfo"
				:open="isCashbackPopoverOpen"
				@update:open="handleCashbackPopoverOpenChange"
		>
			<PopoverTrigger as-child>
				<button
						type="button"
						class="offre-offer-pricing-panel__cashback-trigger m-0 cursor-pointer border-0 bg-transparent p-0 text-left text-inherit outline-none transition-[filter] duration-150 hover:brightness-[0.98] active:brightness-[0.95]"
						aria-label="Показать условия кешбэка CoralBonus"
						@mouseenter="handleCashbackTriggerEnter"
						@mouseleave="handleCashbackTriggerLeave"
				>
					<OffreCashbackBanner
							:amount-label="cashbackInfo.finalBonusLabel"
							class="offre-offer-pricing-panel__cashback"
					/>
				</button>
			</PopoverTrigger>

			<PopoverContent
					side="top"
					align="center"
					class="offre-offer-pricing-panel__cashback-popover w-[min(var(--reka-popover-trigger-width),calc(100vw-32px))] max-w-[calc(100vw-32px)] rounded-xl border-0 bg-white px-3 py-0 shadow-[0_10px_30px_rgba(15,23,42,0.16)]"
					@mouseenter="handleCashbackContentEnter"
					@mouseleave="handleCashbackContentLeave"
			>
				<div class="offre-offer-pricing-panel__cashback-popover-body text-foreground">
					<div class="flex flex-col text-[12px] font-semibold">
						<div
								v-for="promo in cashbackInfo.listOfPromos"
								:key="`${promo.content_txt ?? 'promo'}-${promo.content_num ?? ''}`"
								class="offre-offer-pricing-panel__cashback-row inline-flex items-center justify-between gap-4 border-b border-[rgba(204,214,228,0.60)] py-3 text-balance"
						>
              <span class="offre-offer-pricing-panel__cashback-value text-left">
                {{ promo.content_num ?? "" }}
              </span>
							<a
									v-if="promo.content_link"
									:href="promo.content_link"
									class="offre-offer-pricing-panel__cashback-description cursor-pointer text-right underline decoration-1 underline-offset-2 transition-colors duration-150 hover:text-primary"
									target="_blank"
									rel="noopener noreferrer"
							>
								{{ promo.content_txt }}
							</a>
							<span
									v-else
									class="offre-offer-pricing-panel__cashback-description text-left"
							>
                {{ promo.content_txt }}
              </span>
						</div>

						<div
								class="offre-offer-pricing-panel__cashback-actions inline-flex items-center justify-between gap-4 py-3 text-balance">
							<div class="offre-offer-pricing-panel__cashback-info text-left font-semibold">
								Для начисления бонусов, укажите номер карты в поле "Примечание к заказу"
							</div>
							<a
									href="https://coralbonus.ru/registration?promo=R3R5VO93GKG8N1PGQC1UP0G6EICQLRWEN3Z64WZGC4YBYIKHFJV55IND5O20WUJ"
									class="offre-offer-pricing-panel__cashback-activate inline-flex h-8 shrink-0 items-center justify-center rounded-lg bg-primary px-3 py-1.5 text-primary-foreground transition-colors duration-150 hover:bg-primary/90 active:bg-primary/80"
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

		<Button
				v-if="hasOfferHref"
				as="a"
				:href="offerHref"
				:class="[
        'offre-offer-pricing-panel__action h-12 w-full rounded-[8px] px-4 py-3 text-[16px] leading-[1.3]',
        disabled ? 'pointer-events-none opacity-60' : ''
      ]"
				rel="noopener noreferrer"
				target="_blank"
		>
			{{ disabled ? "Загрузка..." : "Выбрать" }}
		</Button>

		<Button
				v-else
				class="offre-offer-pricing-panel__action h-12 w-full rounded-[8px] px-4 py-3 text-[16px] leading-[1.3]"
				disabled
		>
			Недоступно
		</Button>
	</div>
</template>

<style scoped>
.offre-offer-pricing-panel__discount-badge {
	overflow: visible;
}

.offre-offer-pricing-panel__discount-badge::after {
	content: "";
	position: absolute;
	top: 100%;
	right: 0;
	width: 8px;
	height: 6px;
	background: inherit;
	clip-path: polygon(100% 0, 0 0, 0 100%);
}

@media (min-width: 768px) and (max-width: 1279px) {
	.offre-offer-pricing-panel__cashback-row {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		align-content: start;
		gap: 12px;
	}

	.offre-offer-pricing-panel__cashback-actions {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: center;
	}

	.offre-offer-pricing-panel__cashback-description,
	.offre-offer-pricing-panel__cashback-info {
		min-width: 0;
		text-wrap: balance;
	}
}
</style>
