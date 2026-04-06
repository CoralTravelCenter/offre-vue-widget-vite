<script setup lang="ts">
import {ref, watch} from "vue";
import {UsersIcon} from "lucide-vue-next";
import OffreOfferGuestsStepper from "offre/components/results/OffreOfferGuestsStepper.vue";
import {Button} from "ui/button";
import {Popover, PopoverContent, PopoverTrigger} from "ui/popover";

interface Props {
  adultsCount?: number;
  childrenAges?: number[];
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  adultsCount: 2,
  childrenAges: () => [],
  disabled: false
});

const emit = defineEmits<{
  apply: [value: { adultsCount: number; childrenAges: number[] }];
  reset: [];
}>();

const isOpen = ref(false);
const appliedAdultsCount = ref(2);
const appliedChildrenAges = ref<number[]>([]);
const draftAdultsCount = ref(2);
const draftChildrenAges = ref<number[]>([]);

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
  }
});

function updateAdultsCount(delta: number) {
  draftAdultsCount.value = Math.max(1, Math.min(6, draftAdultsCount.value + delta));
}

function updateChildrenCount(delta: number) {
  if (delta < 0) {
    draftChildrenAges.value = draftChildrenAges.value.slice(0, -1);
    return;
  }

  if (draftChildrenAges.value.length >= 4) {
    return;
  }

  draftChildrenAges.value = [...draftChildrenAges.value, 7];
}

function updateChildAge(index: number, value: number) {
  draftChildrenAges.value = draftChildrenAges.value.map((age, ageIndex) => {
    if (ageIndex !== index) {
      return age;
    }

    return Math.max(0, Math.min(17, value));
  });
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
  emit("reset");
}
</script>

<template>
  <Popover v-model:open="isOpen">
    <PopoverTrigger as-child>
      <Button
        type="button"
        variant="outline"
        :disabled="disabled"
        class="offre-offer-guests-control flex size-10 min-h-10 min-w-10 items-center justify-center border bg-white p-0 text-foreground shadow-none"
        aria-label="Изменить состав туристов"
      >
        <UsersIcon class="offre-offer-guests-control__icon size-4" />
        <span class="offre-offer-guests-control__label">Туристы</span>
      </Button>
    </PopoverTrigger>

    <PopoverContent
      side="top"
      align="end"
      class="offre-offer-guests-control__popover w-[min(300px,calc(100vw-32px))] rounded-xl border bg-white p-3"
      :style="{ borderColor: 'var(--offre-color-chip-border)', boxShadow: 'none' }"
    >
      <div class="offre-offer-guests-control__layout">
        <div class="offre-offer-guests-control__header">
          <div class="offre-offer-guests-control__title">Туристы</div>
          <button
            type="button"
            class="offre-offer-guests-control__reset"
            @click="resetToInitial"
          >
            Сбросить
          </button>
        </div>

        <OffreOfferGuestsStepper
          label="Взрослые"
          :model-value="draftAdultsCount"
          :decrement-disabled="draftAdultsCount <= 1"
          :increment-disabled="draftAdultsCount >= 6"
          @update:model-value="updateAdultsCount"
        />

        <OffreOfferGuestsStepper
          label="Дети"
          :model-value="draftChildrenAges.length"
          :decrement-disabled="draftChildrenAges.length === 0"
          :increment-disabled="draftChildrenAges.length >= 4"
          @update:model-value="updateChildrenCount"
        />

        <div
          v-if="draftChildrenAges.length > 0"
          class="offre-offer-guests-control__children"
        >
          <div class="offre-offer-guests-control__children-title">Возраст детей</div>
          <div class="offre-offer-guests-control__children-grid">
            <div
              v-for="(age, index) in draftChildrenAges"
              :key="`child-age-${index}`"
              class="offre-offer-guests-control__child-age"
            >
              <div class="offre-offer-guests-control__child-label">
                Ребенок {{ index + 1 }}
              </div>
              <input
                :value="age"
                type="number"
                min="0"
                max="17"
                inputmode="numeric"
                class="offre-offer-guests-control__age-input"
                @input="updateChildAge(index, Number(($event.target as HTMLInputElement).value))"
              >
            </div>
          </div>
        </div>

        <div class="offre-offer-guests-control__actions">
          <Button
            type="button"
            class="offre-offer-guests-control__primary"
            @click="applyDraft"
          >
            Применить
          </Button>
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>

<style scoped lang="scss">
.offre-offer-guests-control {
  background-color: transparent;
  border-color: var(--offre-color-chip-border);
  border-radius: 10px;
  cursor: pointer;
  padding: 0;
  transition: border-color 0.15s ease, color 0.15s ease, background-color 0.15s ease;

  &:hover {
    background-color: transparent;
    border-color: rgb(74 158 212);
    color: rgb(74 158 212);
  }
}

.offre-offer-guests-control__icon {
  color: #262626;
  flex-shrink: 0;
  transition: color 0.15s ease;
}

.offre-offer-guests-control__label {
  display: none;
  font-size: 0.875rem;
  line-height: 1.25rem;
}

.offre-offer-guests-control:hover .offre-offer-guests-control__icon {
  color: inherit;
}

@media (min-width: 1024px) {
  .offre-offer-guests-control {
    gap: 0.5rem;
    min-width: auto;
    padding-left: 0.75rem;
    padding-right: 0.75rem;
    width: auto;
  }

  .offre-offer-guests-control__icon {
    display: none;
  }

  .offre-offer-guests-control__label {
    display: inline;
  }
}

.offre-offer-guests-control__layout {
  display: grid;
  gap: 12px;
}

.offre-offer-guests-control__header {
  align-items: center;
  display: flex;
  gap: 12px;
  justify-content: space-between;
}

.offre-offer-guests-control__title,
.offre-offer-guests-control__child-label {
  color: #262626;
}

.offre-offer-guests-control__title {
  font-size: var(--offre-text-body);
  font-weight: 600;
  line-height: 1.25rem;
}

.offre-offer-guests-control__reset {
  background: transparent;
  border: 0;
  color: rgb(74 158 212);
  cursor: pointer;
  font-size: var(--offre-text-meta);
  line-height: var(--offre-leading-meta);
  padding: 0;
  transition: color 0.15s ease;

  &:hover {
    color: rgb(50 119 178);
  }
}

.offre-offer-guests-control__counter-label,
.offre-offer-guests-control__child-label {
  font-size: var(--offre-text-meta);
  line-height: var(--offre-leading-meta);
}

.offre-offer-guests-control__children {
  display: grid;
  gap: 6px;
}

.offre-offer-guests-control__children-title {
  color: #262626;
  font-size: var(--offre-text-meta);
  line-height: var(--offre-leading-meta);
}

.offre-offer-guests-control__children-grid {
  display: grid;
  gap: 6px;
  grid-template-columns: 1fr;
}

.offre-offer-guests-control__child-age {
  align-items: center;
  display: grid;
  display: grid;
  gap: 6px;
  grid-template-columns: minmax(0, 1fr) 72px;
  min-width: 0;
}

.offre-offer-guests-control__age-input {
  -moz-appearance: textfield;
  appearance: textfield;
  background-color: #fff;
  border: 1px solid var(--offre-color-chip-border);
  border-radius: 8px;
  color: #262626;
  font-size: var(--offre-text-meta);
  line-height: var(--offre-leading-meta);
  min-height: 32px;
  padding: 0 10px;
  transition: border-color 0.15s ease, color 0.15s ease, background-color 0.15s ease;
  width: 100%;

  &:hover {
    border-color: rgb(74 158 212);
    color: rgb(74 158 212);
  }

  &:focus {
    border-color: rgb(74 158 212);
    color: #262626;
    outline: none;
  }
}

.offre-offer-guests-control__age-input::-webkit-outer-spin-button,
.offre-offer-guests-control__age-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.offre-offer-guests-control__actions {
  display: block;
}

.offre-offer-guests-control__primary {
  border-radius: var(--offre-radius-segment);
  height: 40px;
  min-height: 40px;
  padding-bottom: 0;
  padding-top: 0;
}

.offre-offer-guests-control__primary {
  width: 100%;
}
</style>
