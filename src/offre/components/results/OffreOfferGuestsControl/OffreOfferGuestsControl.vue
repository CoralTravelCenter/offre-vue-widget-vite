<script setup lang="ts">
import {computed, ref, watch} from "vue";
import {UsersIcon} from "lucide-vue-next";
import OffreOfferGuestsStepper from "@/offre/components/results/OffreOfferGuestsStepper/OffreOfferGuestsStepper.vue";
import {Button} from "@/components/ui/button";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Separator} from "@/components/ui/separator";

interface Props {
	adultsCount?: number;
	childrenAges?: number[];
	defaultAdultsCount?: number;
	defaultChildrenAges?: number[];
	disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	adultsCount: 2,
	childrenAges: () => [],
	defaultAdultsCount: 2,
	defaultChildrenAges: () => [],
	disabled: false
});

const emit = defineEmits<{
	apply: [value: { adultsCount: number; childrenAges: number[] }];
	reset: [];
}>();

const CHILD_AGE_OPTIONS = Array.from({length: 19}, (_, age) => age);

const isOpen = ref(false);
const activeChildAgeGridIndex = ref<number | null>(null);
const appliedAdultsCount = ref(2);
const appliedChildrenAges = ref<number[]>([]);
const draftAdultsCount = ref(2);
const draftChildrenAges = ref<number[]>([]);

const initialAdultsCount = computed(() => {
	return Math.max(1, Number(props.defaultAdultsCount) || 2);
});
const initialChildrenAges = computed(() => {
	return [...props.defaultChildrenAges];
});
const canReset = computed(() => {
	return draftAdultsCount.value !== initialAdultsCount.value
		|| draftChildrenAges.value.length !== initialChildrenAges.value.length
		|| draftChildrenAges.value.some((age, index) => age !== initialChildrenAges.value[index]);
});

function syncAppliedStateFromProps() {
	appliedAdultsCount.value = Math.max(1, Number(props.adultsCount) || 2);
	appliedChildrenAges.value = [...props.childrenAges];
}

function syncDraftStateFromApplied() {
	draftAdultsCount.value = appliedAdultsCount.value;
	draftChildrenAges.value = [...appliedChildrenAges.value];
}

watch(
	() => [props.adultsCount, props.childrenAges] as const,
	() => {
		syncAppliedStateFromProps();
		syncDraftStateFromApplied();
	},
	{immediate: true, deep: true}
);

watch(isOpen, (nextOpen) => {
	if (nextOpen) {
		syncDraftStateFromApplied();
		return;
	}

	activeChildAgeGridIndex.value = null;
});

function updateAdultsCount(delta: number) {
	draftAdultsCount.value = Math.max(1, Math.min(6, draftAdultsCount.value + delta));
}

function updateChildrenCount(delta: number) {
	if (delta < 0) {
		draftChildrenAges.value = draftChildrenAges.value.slice(0, -1);

		if (activeChildAgeGridIndex.value !== null) {
			activeChildAgeGridIndex.value = draftChildrenAges.value[activeChildAgeGridIndex.value] === undefined
				? null
				: activeChildAgeGridIndex.value;
		}

		return;
	}

	if (draftChildrenAges.value.length >= 4) {
		return;
	}

	draftChildrenAges.value = [...draftChildrenAges.value, 7];
}

function updateChildAge(index: number, age: string) {
	const nextAge = Math.max(0, Math.min(18, Number(age) || 0));

	draftChildrenAges.value = draftChildrenAges.value.map((value, valueIndex) => {
		return valueIndex === index ? nextAge : value;
	});

	activeChildAgeGridIndex.value = null;
}

function toggleChildAgeGrid(index: number) {
	activeChildAgeGridIndex.value = activeChildAgeGridIndex.value === index ? null : index;
}

function formatChildAge(age: number) {
	const normalizedAge = Math.max(0, Math.min(18, Number(age) || 0));

	if (normalizedAge === 0) {
		return "до 1 года";
	}

	const remainder100 = normalizedAge % 100;
	const remainder10 = normalizedAge % 10;

	if (remainder100 >= 11 && remainder100 <= 14) {
		return `${normalizedAge} лет`;
	}

	if (remainder10 === 1) {
		return `${normalizedAge} год`;
	}

	if (remainder10 >= 2 && remainder10 <= 4) {
		return `${normalizedAge} года`;
	}

	return `${normalizedAge} лет`;
}

const hasChildren = computed(() => draftChildrenAges.value.length > 0);

function getChildAgeToggleClass(index: number) {
	const isExpanded = activeChildAgeGridIndex.value === index;

	return [
		"offre-offer-guests-control__child-age-toggle",
		isExpanded
			? "offre-offer-guests-control__child-age-toggle--expanded"
			: "offre-offer-guests-control__child-age-toggle--collapsed"
	];
}

function getChildAgeOptionClass(optionAge: number, currentAge: number) {
	const isSelected = optionAge === currentAge;

	return [
		"offre-offer-guests-control__child-age-option",
		isSelected
			? "offre-offer-guests-control__child-age-option--selected"
			: "offre-offer-guests-control__child-age-option--default"
	];
}

function applyDraft() {
	appliedAdultsCount.value = draftAdultsCount.value;
	appliedChildrenAges.value = [...draftChildrenAges.value];

	emit("apply", {
		adultsCount: appliedAdultsCount.value,
		childrenAges: [...appliedChildrenAges.value]
	});

	isOpen.value = false;
}

function resetToInitial() {
	draftAdultsCount.value = initialAdultsCount.value;
	draftChildrenAges.value = [...initialChildrenAges.value];
	appliedAdultsCount.value = initialAdultsCount.value;
	appliedChildrenAges.value = [...initialChildrenAges.value];
	activeChildAgeGridIndex.value = null;
	emit("reset");
	isOpen.value = false;
}
</script>

<template>
	<Popover v-model:open="isOpen">
		<PopoverTrigger as-child>
			<Button
				type="button"
				variant="outline"
				size="brand"
				:disabled="disabled"
				class="offre-offer-guests-control__trigger"
				aria-label="Изменить состав туристов"
			>
				<UsersIcon class="offre-offer-guests-control__trigger-icon"/>
				<span class="offre-offer-guests-control__trigger-label">Состав туристов</span>
			</Button>
		</PopoverTrigger>

		<PopoverContent
			size="brand"
			side="top"
			align="end"
			:side-offset="12"
			class="offre-offer-guests-control__content"
		>
			<div class="offre-offer-guests-control__body">
				<div class="offre-offer-guests-control__header">
					<div class="offre-offer-guests-control__title">
						Состав туристов
					</div>

					<button
						type="button"
						class="offre-offer-guests-control__reset"
						:disabled="!canReset"
						@click="resetToInitial"
					>
						Сбросить
					</button>
				</div>

				<Separator class="offre-offer-guests-control__separator"/>

				<OffreOfferGuestsStepper
					label="Взрослых"
					:model-value="draftAdultsCount"
					:decrement-disabled="draftAdultsCount <= 1"
					:increment-disabled="draftAdultsCount >= 6"
					@update:model-value="updateAdultsCount"
				/>

				<Separator class="offre-offer-guests-control__separator"/>

				<div class="offre-offer-guests-control__section">
					<OffreOfferGuestsStepper
						label="Детей"
						:model-value="draftChildrenAges.length"
						:decrement-disabled="draftChildrenAges.length === 0"
						:increment-disabled="draftChildrenAges.length >= 4"
						@update:model-value="updateChildrenCount"
					/>

					<div
						v-if="hasChildren"
						class="offre-offer-guests-control__children offre-offer-guests-control__children--with-items"
					>
						<div class="offre-offer-guests-control__children-title">
							Возраст детей
						</div>

						<div
							v-for="(age, index) in draftChildrenAges"
							:key="`child-age-${index}`"
							class="offre-offer-guests-control__child-group"
						>
							<div class="offre-offer-guests-control__child-row">
								<div class="offre-offer-guests-control__child-label">
									Ребенок {{ index + 1 }}
								</div>

								<button
									type="button"
									:class="getChildAgeToggleClass(index)"
									@click="toggleChildAgeGrid(index)"
								>
									{{ formatChildAge(age) }}
								</button>
							</div>

							<div
								v-if="activeChildAgeGridIndex === index"
								class="offre-offer-guests-control__child-age-grid"
							>
								<button
									v-for="childAge in CHILD_AGE_OPTIONS"
									:key="childAge"
									type="button"
									:class="getChildAgeOptionClass(childAge, age)"
									@click="updateChildAge(index, String(childAge))"
								>
									{{ childAge === 0 ? "0" : childAge }}
								</button>
							</div>
						</div>
					</div>
				</div>

				<Separator class="offre-offer-guests-control__separator"/>

				<Button
					type="button"
					size="brand"
					class="offre-offer-guests-control__apply"
					@click="applyDraft"
				>
					Применить
				</Button>
			</div>
		</PopoverContent>
	</Popover>
</template>

<style scoped src="./OffreOfferGuestsControl.scss" lang="scss"></style>
