<script setup lang="ts">
import {TriangleAlertIcon} from "lucide-vue-next";

type NoticeVariant = "error" | "warning";

interface Props {
	title: string;
	description?: string;
	variant?: NoticeVariant;
}

withDefaults(defineProps<Props>(), {
	description: "",
	variant: "warning"
});
</script>

<template>
	<div
		class="offre-results-state-notice"
		:class="variant === 'error'
			? 'offre-results-state-notice--error'
			: 'offre-results-state-notice--warning'"
	>
		<div class="offre-results-state-notice__layout">
			<div
				class="offre-results-state-notice__icon"
				:class="variant === 'error'
					? 'offre-results-state-notice__icon--error'
					: 'offre-results-state-notice__icon--warning'"
				aria-hidden="true"
			>
				<TriangleAlertIcon class="offre-results-state-notice__icon-svg"/>
			</div>
			<div class="offre-results-state-notice__copy">
				<p class="offre-results-state-notice__title">
					{{ title }}
				</p>
				<p
					v-if="description"
					class="offre-results-state-notice__description"
				>
					{{ description }}
				</p>
			</div>
		</div>
	</div>
</template>

<style scoped src="./OffreResultsStateNotice.scss" lang="scss"></style>
