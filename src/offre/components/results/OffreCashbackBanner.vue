<script setup lang="ts">
import CashbackHintIcon from "offre/components/results/icons/CashbackHintIcon.vue";

interface Props {
	amountLabel?: string;
}

withDefaults(defineProps<Props>(), {
	amountLabel: ""
});
</script>

<template>
	<div class="offre-cashback-banner rounded-[4px] bg-[#FFF1CC] p-2">
		<div class="offre-cashback-banner__content flex items-center justify-between gap-3">
			<div class="offre-cashback-banner__card shrink-0">
				<img
						src="https://b2ccdn.coral.ru/content/cb-card-offre-vue.png"
						alt="CoralBonus"
						class="offre-cashback-banner__card-image block h-auto w-[55px] object-contain"
				>
			</div>
			<div class="offre-cashback-banner__title flex flex-col mr-auto">
				<span class="text-[14px] font-medium leading-4 text-black">Кешбэк до {{ amountLabel }}</span>
				<span class="offre-cashback-banner__subtitle-text">на карту CoralBonus</span>
			</div>
			<CashbackHintIcon class="offre-cashback-banner__hint h-5 w-5 shrink-0"/>
		</div>
	</div>
</template>

<style scoped>
.offre-cashback-banner__card-image {
	animation: offre-cashback-card-pulse 10s ease-in-out infinite;
	transform-origin: center;
	will-change: transform, filter;
}

@keyframes offre-cashback-card-pulse {
	0%, 86%, 100% {
		transform: scale(1);
		filter: none;
	}

	88% {
		transform: scale(1.04);
		filter: drop-shadow(0 0 6px rgba(0, 147, 208, 0.3));
	}

	90% {
		transform: scale(1);
		filter: none;
	}

	92% {
		transform: scale(1.03);
		filter: drop-shadow(0 0 5px rgba(0, 147, 208, 0.24));
	}

	94% {
		transform: scale(1);
		filter: none;
	}
}
</style>
