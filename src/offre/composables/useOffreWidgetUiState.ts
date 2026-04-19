import { computed, ref, toValue, watch, type MaybeRefOrGetter } from "vue";
import type { B2CRoomCriteria } from "offre/api/types";
import type { NormalizedOffreWidgetOptions } from "offre/lib/payload";

const GUESTS_STORAGE_PREFIX = "offre-widget:guests";
const MAX_ADULTS_COUNT = 6;
const MAX_CHILDREN_COUNT = 4;
const MAX_CHILD_AGE = 18;

export interface OffreWidgetGuestsState {
  adultsCount: number;
  childrenAges: number[];
}

function canUseSessionStorage() {
  try {
    return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
  } catch {
    return false;
  }
}

function normalizeGuestsState(value: OffreWidgetGuestsState): OffreWidgetGuestsState {
  const adultsCount = Math.max(1, Math.min(MAX_ADULTS_COUNT, Math.trunc(Number(value.adultsCount) || 2)));
  const childrenAges = Array.isArray(value.childrenAges)
    ? value.childrenAges
      .map((age) => Math.trunc(Number(age)))
      .filter((age) => Number.isFinite(age))
      .map((age) => Math.max(0, Math.min(MAX_CHILD_AGE, age)))
      .slice(0, MAX_CHILDREN_COUNT)
    : [];

  return {
    adultsCount,
    childrenAges
  };
}

function isPersistedGuestsState(value: unknown): value is OffreWidgetGuestsState {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  if (!Number.isInteger(candidate.adultsCount) || Number(candidate.adultsCount) < 1 || Number(candidate.adultsCount) > MAX_ADULTS_COUNT) {
    return false;
  }

  if (!Array.isArray(candidate.childrenAges) || candidate.childrenAges.length > MAX_CHILDREN_COUNT) {
    return false;
  }

  return candidate.childrenAges.every((age) => {
    return Number.isInteger(age) && Number(age) >= 0 && Number(age) <= MAX_CHILD_AGE;
  });
}

function resolveGuestsStorageKey(key: string | null | undefined) {
  const normalizedKey = String(key ?? "").trim();

  if (!normalizedKey) {
    return "";
  }

  return `${GUESTS_STORAGE_PREFIX}:${normalizedKey}`;
}

function readPersistedGuestsState(key: string | null | undefined) {
  const storageKey = resolveGuestsStorageKey(key);

  if (!storageKey || !canUseSessionStorage()) {
    return null;
  }

  try {
    const rawValue = window.sessionStorage.getItem(storageKey);

    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue) as unknown;

    return isPersistedGuestsState(parsedValue)
      ? normalizeGuestsState(parsedValue)
      : null;
  } catch {
    return null;
  }
}

function writePersistedGuestsState(key: string | null | undefined, value: OffreWidgetGuestsState) {
  const storageKey = resolveGuestsStorageKey(key);

  if (!storageKey || !canUseSessionStorage()) {
    return;
  }

  window.sessionStorage.setItem(storageKey, JSON.stringify(normalizeGuestsState(value)));
}

function resolveInitialGuestsState(roomCriterias: B2CRoomCriteria[] | undefined): OffreWidgetGuestsState {
  const passengers = roomCriterias?.[0]?.passengers ?? [
    { age: 20, passengerType: 0 },
    { age: 20, passengerType: 0 }
  ];

  return {
    adultsCount: passengers.filter((passenger) => Number(passenger.passengerType) === 0).length || 2,
    childrenAges: passengers
      .filter((passenger) => Number(passenger.passengerType) !== 0)
      .map((passenger) => Number(passenger.age))
      .filter((age) => Number.isFinite(age))
  };
}

export function useOffreWidgetUiState(params: {
  optionsSource: MaybeRefOrGetter<NormalizedOffreWidgetOptions>;
  storageKeySource?: MaybeRefOrGetter<string | null | undefined>;
}) {
  const storageKey = computed(() => String(toValue(params.storageKeySource) ?? "").trim());
  const selectedGuests = ref(resolveInitialGuestsState(toValue(params.optionsSource).roomCriterias));

  watch(
    [storageKey, () => toValue(params.optionsSource).roomCriterias] as const,
    ([nextStorageKey, nextRoomCriterias]) => {
      selectedGuests.value = readPersistedGuestsState(nextStorageKey)
        ?? resolveInitialGuestsState(nextRoomCriterias);
    },
    { immediate: true }
  );

  watch(
    selectedGuests,
    (nextGuests) => {
      writePersistedGuestsState(storageKey.value, nextGuests);
    },
    { deep: true }
  );

  const selectedRoomCriterias = computed<B2CRoomCriteria[]>(() => {
    return [{
      passengers: [
        ...Array.from({ length: selectedGuests.value.adultsCount }, () => ({
          age: 20,
          passengerType: 0
        })),
        ...selectedGuests.value.childrenAges.map((age) => ({
          age,
          passengerType: 1
        }))
      ]
    }];
  });

  const effectiveSearchOptions = computed(() => ({
    ...toValue(params.optionsSource),
    roomCriterias: selectedRoomCriterias.value
  }));

  const guestsFilterKey = computed(() => JSON.stringify(selectedGuests.value));

  function handleGuestsApply(value: OffreWidgetGuestsState) {
    selectedGuests.value = normalizeGuestsState(value);
  }

  function handleGuestsReset() {
    selectedGuests.value = resolveInitialGuestsState(toValue(params.optionsSource).roomCriterias);
  }

  return {
    selectedGuests,
    selectedRoomCriterias,
    effectiveSearchOptions,
    guestsFilterKey,
    handleGuestsApply,
    handleGuestsReset
  };
}
