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

const AGE_OPTIONS = Array.from({length: 18}, (_, age) => age);

const isOpen = ref(false);
const appliedAdultsCount = ref(2);
const appliedChildrenAges = ref<number[]>([]);
const draftAdultsCount = ref(2);
const draftChildrenAges = ref<number[]>([]);

const canReset = computed(() => {
  return appliedAdultsCount.value !== 2 || appliedChildrenAges.value.length > 0;
});

function formatAgeLabel(age: number) {
  const normalizedAge = Math.max(0, Math.min(17, Number(age) || 0));
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

function updateChildAge(index: number, value: string) {
  const nextAge = Math.max(0, Math.min(17, Number(value) || 0));

  draftChildrenAges.value = draftChildrenAges.value.map((age, ageIndex) => {
    return ageIndex === index ? nextAge : age;
  });
}

function removeChild(index: number) {
  draftChildrenAges.value = draftChildrenAges.value.filter((_, childIndex) => childIndex !== index);
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
        class="min-w-[300px] w-auto max-w-[calc(100vw-24px)] rounded-[24px] border-[#e9e9e7] bg-white p-4 shadow-[0_20px_80px_rgba(15,23,42,0.08)]"
    >
      <div class="grid gap-4">
        <div class="flex items-center justify-between gap-4">
          <div class="text-[16px] font-normal leading-none text-black">
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
            <div
                v-for="(age, index) in draftChildrenAges"
                :key="`child-age-${index}`"
                class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3"
            >
              <div class="text-[12px] font-normal leading-[1.2] text-[#3f3f46]">
                Ребенок {{ index + 1 }}
              </div>

              <Button class="h-10 min-w-[96px] rounded-[14px] bg-[#F5F5F5] px-3 text-[12px] font-normal text-black hover:bg-[#ededed]">
                {{ age }} лет
              </Button>
            </div>
          </div>
        </div>

        <Separator class="bg-[#ecebe8]"/>

        <Button
            type="button"
            class="h-12 w-full rounded-[18px] bg-[#4a96cf] text-[12px] font-normal text-white hover:bg-[#3b89c3]"
            @click="applyDraft"
        >
          Применить
        </Button>
      </div>
    </PopoverContent>
  </Popover>
</template>
