<script setup lang="ts">
import {computed, ref, watch} from "vue";
import {UsersIcon} from "lucide-vue-next";
import OffreOfferGuestsStepper from "offre/components/results/OffreOfferGuestsStepper.vue";
import {Button} from "ui/button";
import {Popover, PopoverContent, PopoverTrigger} from "ui/popover";
import {Separator} from "ui/separator";

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

const CHILD_AGE_OPTIONS = Array.from({length: 19}, (_, age) => age);

const isOpen = ref(false);
const activeChildAgeGridIndex = ref<number | null>(null);
const appliedAdultsCount = ref(2);
const appliedChildrenAges = ref<number[]>([]);
const draftAdultsCount = ref(2);
const draftChildrenAges = ref<number[]>([]);

const canReset = computed(() => {
  return appliedAdultsCount.value !== 2 || appliedChildrenAges.value.length > 0;
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
      activeChildAgeGridIndex.value = draftChildrenAges.value[activeChildAgeGridIndex.value]
      === undefined
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
          size="brand"
          :disabled="disabled"
          class="offre-offer-guests-control__trigger flex size-10 min-h-10 min-w-10 items-center justify-center bg-transparent p-0 text-brand-foreground shadow-none transition-[border-color,color,background-color] hover:border-brand-primary hover:bg-transparent hover:text-brand-primary lg:w-auto lg:min-w-0 lg:gap-2 lg:px-3"
          aria-label="Изменить состав туристов"
      >
        <UsersIcon class="offre-offer-guests-control__trigger-icon size-4 shrink-0 text-brand-foreground transition-colors lg:hidden"/>
        <span class="offre-offer-guests-control__trigger-label hidden lg:inline">Туристы</span>
      </Button>
    </PopoverTrigger>

    <PopoverContent
        size="brand"
        side="top"
        align="end"
        :side-offset="12"
        class="offre-offer-guests-control__content min-w-75 w-auto max-w-[calc(100vw-24px)] bg-brand-card p-4 shadow-brand-popover"
    >
      <div class="offre-offer-guests-control__body grid gap-4">
        <div class="offre-offer-guests-control__header flex items-center justify-between gap-3">
          <div class="offre-offer-guests-control__title text-brand-foreground">
            Туристы
          </div>

          <button
              type="button"
              class="offre-offer-guests-control__reset text-brand-primary transition-colors hover:text-brand-primary/80 disabled:pointer-events-none disabled:opacity-40"
              :disabled="!canReset"
              @click="resetToInitial"
          >
            Сбросить
          </button>
        </div>

        <Separator class="bg-brand-border"/>

        <OffreOfferGuestsStepper
            label="Взрослых"
            :model-value="draftAdultsCount"
            :decrement-disabled="draftAdultsCount <= 1"
            :increment-disabled="draftAdultsCount >= 6"
            @update:model-value="updateAdultsCount"
        />

        <Separator class="bg-brand-border"/>

        <div class="grid gap-4">
          <OffreOfferGuestsStepper
              label="Детей"
              :model-value="draftChildrenAges.length"
              :decrement-disabled="draftChildrenAges.length === 0"
              :increment-disabled="draftChildrenAges.length >= 4"
              @update:model-value="updateChildrenCount"
          />

          <div
              v-if="draftChildrenAges.length > 0"
              class="offre-offer-guests-control__children grid gap-3"
          >
            <div class="offre-offer-guests-control__children-title text-brand-foreground">
              Возраст детей
            </div>

            <div
                v-for="(age, index) in draftChildrenAges"
                :key="`child-age-${index}`"
                class="grid gap-3"
            >
              <div class="offre-offer-guests-control__child-row grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                <div class="offre-offer-guests-control__child-label text-brand-foreground/80">
                  Ребенок {{ index + 1 }}
                </div>

                <button
                    type="button"
                    class="offre-offer-guests-control__child-age-toggle min-w-[70px] cursor-pointer bg-brand-muted px-3 py-2 text-brand-foreground transition-colors hover:bg-brand-primary hover:text-brand-primary-foreground"
                    @click="toggleChildAgeGrid(index)"
                >
                  {{ formatChildAge(age) }}
                </button>
              </div>

              <div
                  v-if="activeChildAgeGridIndex === index"
                  class="offre-offer-guests-control__child-age-grid grid grid-cols-6 gap-1 bg-brand-card p-0"
              >
                <button
                    v-for="childAge in CHILD_AGE_OPTIONS"
                    :key="childAge"
                    type="button"
                    :class="[
                      'offre-offer-guests-control__child-age-option flex size-[35px] items-center justify-center border border-transparent bg-brand-muted px-2 py-1 text-brand-foreground transition-colors hover:bg-brand-primary hover:text-brand-primary-foreground',
                      childAge === age ? 'offre-offer-guests-control__child-age-option--active bg-brand-primary text-brand-primary-foreground' : ''
                    ]"
                    @click="updateChildAge(index, String(childAge))"
                >
                  {{ childAge === 0 ? "0" : childAge }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <Separator class="bg-brand-border"/>

        <Button
            type="button"
            size="brand"
            class="offre-offer-guests-control__apply w-full bg-brand-primary px-4 py-2 text-brand-primary-foreground hover:bg-brand-primary/90"
            @click="applyDraft"
        >
          Применить
        </Button>
      </div>
    </PopoverContent>
  </Popover>
</template>

<style scoped lang="scss">
.offre-offer-guests-control__trigger {
  border-color: var(--brand-control-border);
  border-radius: var(--brand-radius-button);
}

.offre-offer-guests-control__trigger-label {
  font-size: var(--brand-text-control);
  line-height: var(--brand-leading-control);
}

.offre-offer-guests-control__content {
  border-radius: var(--brand-radius-panel);
}

.offre-offer-guests-control__title {
  font-size: var(--brand-text-button);
  line-height: var(--brand-leading-button);
}

.offre-offer-guests-control__reset,
.offre-offer-guests-control__children-title,
.offre-offer-guests-control__child-label,
.offre-offer-guests-control__child-age-toggle,
.offre-offer-guests-control__child-age-option {
  font-size: var(--brand-text-meta);
}

.offre-offer-guests-control__children-title,
.offre-offer-guests-control__child-label {
  line-height: var(--brand-leading-meta);
}

.offre-offer-guests-control__child-age-toggle {
  border-radius: var(--brand-radius-segment);
  line-height: 1;
}

.offre-offer-guests-control__child-age-grid {
  border-radius: var(--brand-radius-badge);
}

.offre-offer-guests-control__child-age-option {
  border-radius: var(--brand-radius-media);
  line-height: 1;
}

.offre-offer-guests-control__apply {
  border-radius: var(--brand-radius-button);
  font-size: var(--brand-text-button);
  line-height: var(--brand-leading-button);
}
</style>
