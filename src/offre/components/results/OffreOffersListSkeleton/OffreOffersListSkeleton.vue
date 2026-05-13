<script setup lang="ts">
import OffreOfferCardSkeleton from "@/offre/components/results/OffreOfferCardSkeleton/OffreOfferCardSkeleton.vue";

interface Props {
	items?: number;
}

withDefaults(defineProps<Props>(), {
	items: 4
});
</script>

<template>
	<section class="offre-offers-list-skeleton" aria-hidden="true">
		<OffreOfferCardSkeleton
			v-for="index in items"
			:key="index"
			class="offre-offers-list-skeleton__item"
		/>
	</section>
</template>

<style scoped src="./OffreOffersListSkeleton.scss" lang="scss"></style>
