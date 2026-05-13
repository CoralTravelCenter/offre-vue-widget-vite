<script setup lang="ts">
interface Props {
	count: number;
	minPrice?: string;
	maxPrice?: string;
}

withDefaults(defineProps<Props>(), {
	minPrice: "",
	maxPrice: ""
});
</script>

<template>
	<div class="offre-map-cluster-badge">
		<div class="offre-map-cluster-badge__count">
			{{ count }}
		</div>

		<div
			v-if="minPrice || maxPrice"
			class="offre-map-cluster-badge__price-range"
		>
			<span
				v-if="minPrice"
				class="offre-map-cluster-badge__price-line"
			>
				от {{ minPrice }}
			</span>
			<span
				v-if="maxPrice"
				class="offre-map-cluster-badge__price-line"
			>
				до {{ maxPrice }}
			</span>
		</div>
	</div>
</template>

<style scoped src="./OffreMapClusterBadge.scss" lang="scss"></style>
