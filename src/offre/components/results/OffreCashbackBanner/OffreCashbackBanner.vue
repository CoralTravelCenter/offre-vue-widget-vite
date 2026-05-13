<script setup lang="ts">
import CashbackHintIcon from "@/offre/components/results/icons/CashbackHintIcon.vue";

interface Props {
	amountLabel?: string;
}

withDefaults(defineProps<Props>(), {
	amountLabel: ""
});
</script>

<template>
	<div class="offre-cashback-banner">
		<div class="offre-cashback-banner__content">
			<div class="offre-cashback-banner__card card-visual">
				<img
						src="https://b2ccdn.coral.ru/content/cb-card-offre-vue.png"
						alt="CoralBonus"
						class="offre-cashback-banner__card-image"
				>
			</div>
			<div class="offre-cashback-banner__title info">
				<span class="offre-cashback-banner__amount up-to">
					Кешбэк до {{ amountLabel }}
				</span>
				<span class="offre-cashback-banner__subtitle-text to-coral-bonus-card">
					на карту CoralBonus
				</span>
			</div>
			<CashbackHintIcon class="offre-cashback-banner__hint"/>
		</div>
	</div>
</template>

<style scoped src="./OffreCashbackBanner.scss" lang="scss"></style>
