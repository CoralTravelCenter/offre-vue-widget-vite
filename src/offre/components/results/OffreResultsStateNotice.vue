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
			class="offre-results-state-notice rounded-[12px] border border-transparent px-6 py-7"
			:class="variant === 'error' ? 'bg-[#f7eaea]' : 'bg-[#fff7e6]'"
	>
		<div class="offre-results-state-notice__layout mx-auto flex items-center justify-center gap-5">
			<div
					class="offre-results-state-notice__icon flex h-12 w-12 shrink-0 items-center justify-center"
					:class="variant === 'error' ? 'text-[#dc2626]' : 'text-[#d4a017]'"
			     aria-hidden="true">
				<TriangleAlertIcon class="size-12"/>
			</div>
			<div class="offre-results-state-notice__copy min-w-0">
				<p class="offre-results-state-notice__title m-0 text-[14px] font-semibold leading-[1.3] text-[#101828] md:text-[16px]">
					{{ title }}
				</p>
				<p
						v-if="description"
						class="offre-results-state-notice__description mt-2 m-0 text-[14px] leading-[1.45] text-[#4b5563] md:text-[16px]"
				>
					{{ description }}
				</p>
			</div>
		</div>
	</div>
</template>
