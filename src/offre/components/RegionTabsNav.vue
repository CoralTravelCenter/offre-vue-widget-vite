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

const shellRef = ref<HTMLElement | null>(null);
const scrollerRef = ref<HTMLElement | null>(null);
const hasInitialScrollSync = ref(false);

function syncScrollerElement() {
	scrollerRef.value = shellRef.value?.querySelector<HTMLElement>("[data-slot='tabs-list']") ?? null;
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
	<Tabs v-else v-model="modelValue" class="region-tabs-nav">
		<div
				ref="shellRef"
				class="region-tabs-nav__shell min-w-0"
		>
			<TabsList
					:aria-label="ariaLabel"
					class="region-tabs-nav__list offre-scroll-no-bar offre-scroll-snap-x flex w-full items-center justify-start gap-2 overflow-x-auto bg-white"
			>
				<TabsTrigger
						v-for="tab in visibleTabs"
						:key="tab.id"
						:value="tab.id"
						:data-region-id="tab.id"
						class="region-tabs-nav__item shrink-0 rounded-3xl border border-[#F0F0F0] px-5 py-[9px] text-sm text-black data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-white"
				>
					{{ tab.label }}
				</TabsTrigger>
			</TabsList>
		</div>
	</Tabs>
</template>
