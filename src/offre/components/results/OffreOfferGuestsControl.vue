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
          :disabled="disabled"
          class="flex size-10 min-h-10 min-w-10 items-center justify-center rounded-[10px] border-(--offre-color-chip-border) bg-transparent p-0 text-foreground shadow-none transition-[border-color,color,background-color] hover:border-[#4a9ed4] hover:bg-transparent hover:text-[#4a9ed4] lg:w-auto lg:min-w-0 lg:gap-2 lg:px-3"
          aria-label="Изменить состав туристов"
      >
        <UsersIcon class="size-4 shrink-0 text-[#262626] transition-colors lg:hidden"/>
        <span class="hidden text-sm lg:inline">Туристы</span>
      </Button>
    </PopoverTrigger>

    <PopoverContent
        side="top"
        align="end"
        :side-offset="12"
        class="min-w-75 w-auto max-w-[calc(100vw-24px)] rounded-3xl border-[#e9e9e7] bg-white p-4 shadow-[0_20px_80px_rgba(15,23,42,0.08)]"
    >
      <div class="grid gap-4">
        <div class="flex items-center justify-between gap-3">
          <div class="text-[16px] font-bold leading-none text-black">
            Туристы
          </div>

          <button
              type="button"
              class="text-[12px] font-normal leading-none text-[#4a9ed4] transition-colors hover:text-[#3277b2] disabled:pointer-events-none disabled:opacity-40"
              :disabled="!canReset"
              @click="resetToInitial"
          >
            Сбросить
          </button>
        </div>

        <Separator class="bg-[#ecebe8]"/>

        <OffreOfferGuestsStepper
            label="Взрослых"
            :model-value="draftAdultsCount"
            :decrement-disabled="draftAdultsCount <= 1"
            :increment-disabled="draftAdultsCount >= 6"
            @update:model-value="updateAdultsCount"
        />

        <Separator class="bg-[#ecebe8]"/>

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
              class="grid gap-3"
          >
            <div class="text-[12px] font-bold leading-[1.2] text-black">
              Возраст детей
            </div>

            <div
                v-for="(age, index) in draftChildrenAges"
                :key="`child-age-${index}`"
                class="grid gap-3"
            >
              <div class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                <div class="text-[12px] font-normal leading-[1.2] text-[#3f3f46]">
                  Ребенок {{ index + 1 }}
                </div>

                <button
                    type="button"
                    class="min-w-[70px] cursor-pointer rounded-[6px] bg-[#F5F5F5] px-3 py-2 text-[12px] font-normal leading-none text-black transition-colors hover:bg-primary hover:text-primary-foreground"
                    @click="toggleChildAgeGrid(index)"
                >
                  {{ formatChildAge(age) }}
                </button>
              </div>

              <div
                  v-if="activeChildAgeGridIndex === index"
                  class="grid grid-cols-6 gap-1 rounded-[12px] bg-white p-0"
              >
                <button
                    v-for="childAge in CHILD_AGE_OPTIONS"
                    :key="childAge"
                    type="button"
                    class="flex size-[35px] items-center justify-center rounded-[8px] border border-transparent bg-[#F5F5F5] px-2 py-1 text-[12px] font-normal leading-none text-black transition-colors hover:bg-primary hover:text-primary-foreground"
                    :class="childAge === age ? 'bg-primary text-primary-foreground' : ''"
                    @click="updateChildAge(index, String(childAge))"
                >
                  {{ childAge === 0 ? "0" : childAge }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <Separator class="bg-[#ecebe8]"/>

        <Button
            type="button"
            class="w-full rounded-[8px] bg-primary px-4 py-2 text-[16px] font-normal text-primary-foreground hover:bg-primary/90"
            @click="applyDraft"
        >
          Применить
        </Button>
      </div>
    </PopoverContent>
  </Popover>
</template>
