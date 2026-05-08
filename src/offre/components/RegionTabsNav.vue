<script setup lang="ts">
import {Tabs, TabsList, TabsTrigger} from "ui/tabs";
import RegionTabsNavSkeleton from "offre/components/RegionTabsNavSkeleton.vue";
import type {RegionTabItem} from "offre/types";
import {computed, nextTick, ref, watch} from "vue";

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

function getTabClass(tabId: string) {
	const isSelected = tabId === modelValue.value;

	return [
		"region-tabs-nav__item flex-none rounded-full border px-4 py-2 text-[14px] leading-[var(--brand-leading-control)] transition-[border-color,background-color,color]",
		isSelected
			? "region-tabs-nav__item--selected selected border-brand-primary bg-brand-primary text-brand-primary-foreground data-[state=active]:border-brand-primary data-[state=active]:bg-brand-primary data-[state=active]:text-brand-primary-foreground"
			: "region-tabs-nav__item--default border-brand-control-border bg-brand-card text-brand-foreground hover:border-brand-primary hover:text-brand-primary"
	];
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
</script>

<template>
	<RegionTabsNavSkeleton v-if="isLoading"/>
	<div v-else ref="rootRef" class="region-tabs-nav region-select min-w-0">
		<Tabs
				v-model="modelValue"
				class="region-tabs-nav__tabs min-w-0"
		>
			<TabsList
					:aria-label="ariaLabel"
					size="brand"
					class="region-tabs-nav__list offre-scroll-no-bar offre-scroll-snap-x flex h-10 w-full items-center justify-start gap-2 overflow-x-auto bg-transparent"
			>
				<TabsTrigger
						v-for="tab in visibleTabs"
						:key="tab.id"
						:value="tab.id"
						:data-region-id="tab.id"
						size="brand"
						:class="getTabClass(tab.id)"
				>
					{{ tab.label }}
				</TabsTrigger>
			</TabsList>
		</Tabs>
	</div>
</template>
