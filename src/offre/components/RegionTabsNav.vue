<script setup lang="ts">
import {Tabs, TabsList, TabsTrigger} from "@/shared/components/ui/tabs";
import RegionTabsNavSkeleton from "offre/components/RegionTabsNavSkeleton.vue";
import type {RegionTabItem} from "offre/types";
import {computed, nextTick, onMounted, ref, watch} from "vue";

interface Props {
	tabs: RegionTabItem[];
	isLoading?: boolean;
	ariaLabel?: string;
}

const modelValue = defineModel<string>({required: true});

const props = withDefaults(defineProps<Props>(), {
	tabs: () => [],
	isLoading: false,
	ariaLabel: "Регионы",
});

const visibleTabs = computed(() => props.tabs.filter((tab) => !tab.disabled));
const availableTabIds = computed(() => visibleTabs.value.map((tab) => tab.id));

const rootRef = ref<HTMLElement | null>(null);
const scrollerRef = ref<HTMLElement | null>(null);
const hasInitialScrollSync = ref(false);

function syncScrollerElement() {
	scrollerRef.value = rootRef.value?.querySelector<HTMLElement>("[data-slot='tabs-list']") ?? null;
}

function scrollToValue(value: string, behavior: ScrollBehavior = "smooth") {
	const container = scrollerRef.value;

	if (!value || !container) {
		return;
	}

	const activeItem = Array.from(container.children).find((element) => {
		return element instanceof HTMLElement && element.dataset.regionId === value;
	});

	if (!(activeItem instanceof HTMLElement)) {
		return;
	}

	activeItem.scrollIntoView({behavior, inline: "start", block: "nearest"});
}

watch(
		[modelValue, availableTabIds],
		async ([value, tabIds]) => {
			syncScrollerElement();

			if (!value || !tabIds.includes(value)) {
				return;
			}

			await nextTick();
			scrollToValue(value, hasInitialScrollSync.value ? "smooth" : "auto");
			hasInitialScrollSync.value = true;
		},
		{immediate: true}
);

onMounted(async () => {
	await nextTick();
	syncScrollerElement();
});
</script>

<template>
	<RegionTabsNavSkeleton v-if="isLoading"/>
	<div v-else ref="rootRef" class="region-tabs-nav min-w-0">
		<Tabs
				v-model="modelValue"
				class="min-w-0"
		>
			<TabsList
					:aria-label="ariaLabel"
					size="brand"
					class="region-tabs-nav__list offre-scroll-no-bar offre-scroll-snap-x flex w-full items-center justify-start gap-2 overflow-x-auto"
			>
				<TabsTrigger
						v-for="tab in visibleTabs"
						:key="tab.id"
						:value="tab.id"
						:data-region-id="tab.id"
						size="brand"
						class="region-tabs-nav__item"
				>
					{{ tab.label }}
				</TabsTrigger>
			</TabsList>
		</Tabs>
	</div>
</template>

<style scoped lang="scss">
.region-tabs-nav__list {
	min-height: 40px;
}

.region-tabs-nav__item {
	background-color: var(--brand-card);
	border-color: var(--brand-control-border);
	border-radius: 999px;
	color: var(--brand-foreground);
	flex: 0 0 auto;
	font-size: var(--brand-text-control);
	line-height: var(--brand-leading-control);
	padding: 8px 16px;
	transition: border-color 0.15s ease, background-color 0.15s ease, color 0.15s ease;

	&[data-state="active"] {
		background-color: var(--brand-primary);
		border-color: var(--brand-primary);
		color: var(--brand-primary-foreground);
	}

	&:not([data-state="active"]):hover {
		border-color: var(--brand-primary);
		color: var(--brand-primary);
	}
}
</style>
