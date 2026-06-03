import { unref, type Ref } from "vue";

type MaybeRef<T> = T | Ref<T>;

export type FixedOffsetValue = string | number | null | undefined;

export interface FixedStateSnapshot {
  top: boolean;
  bottom: boolean;
  fixed: boolean;
}

export interface FixedConfig {
  top?: MaybeRef<FixedOffsetValue>;
  zIndex?: MaybeRef<number | string | null | undefined>;
  onStick?: MaybeRef<((state: FixedStateSnapshot) => void) | null | undefined>;
}

export type FixedBindingValue = FixedConfig | null | undefined;

export interface NormalizedFixedConfig {
  top: FixedOffsetValue;
  zIndex: number | string | null | undefined;
  onStick: ((state: FixedStateSnapshot) => void) | null | undefined;
}

const FIXED_EPSILON = 0.5;

function getRawValue<T>(value: MaybeRef<T> | T) {
  return unref(value);
}

export function normalizeLength(value: FixedOffsetValue) {
  const raw = getRawValue(value);

  if (raw === null || raw === undefined || raw === "") {
    return "";
  }

  if (typeof raw === "number") {
    return `${raw}px`;
  }

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    return /^-?\d+(\.\d+)?$/.test(trimmed) ? `${trimmed}px` : trimmed;
  }

  return "";
}

export function normalizeOffsetNumber(value: FixedOffsetValue, fallback: number) {
  const raw = getRawValue(value);

  if (raw === null || raw === undefined || raw === "") {
    return fallback;
  }

  if (typeof raw === "number") {
    return Number.isFinite(raw) ? raw : fallback;
  }

  if (typeof raw === "string") {
    const parsed = Number.parseFloat(raw);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

export function normalizeFixedConfig(rawConfig: FixedBindingValue): NormalizedFixedConfig {
  const raw = getRawValue(rawConfig);

  if (raw === null || raw === undefined) {
    return {
      top: raw,
      zIndex: null,
      onStick: null
    };
  }

  const config = typeof raw === "object" ? raw : {};
  const top = getRawValue(config.top);
  const zIndex = getRawValue(config.zIndex);
  const onStick = getRawValue(config.onStick);

  return { top, zIndex, onStick };
}

export function applyFixedStateClasses(el: HTMLElement, fixedState: FixedStateSnapshot) {
  el.classList.toggle("top-fixed", fixedState.top);
  el.classList.toggle("bottom-fixed", fixedState.bottom);
  el.classList.toggle("fixeded", fixedState.fixed);
  el.classList.toggle("sticked", fixedState.fixed);
  el.setAttribute("data-fixed", fixedState.fixed ? "true" : "false");
}

export function areFixedStatesEqual(previousState: FixedStateSnapshot, nextState: FixedStateSnapshot) {
  return previousState.top === nextState.top
    && previousState.bottom === nextState.bottom
    && previousState.fixed === nextState.fixed;
}

export function resolveFixedBoundaryElement(
  el: HTMLElement,
) {
  return el.closest<HTMLElement>(".offre-widget");
}

export function shouldAnchorFixedToBoundaryBottom(params: {
  boundaryRect: DOMRect;
  referenceRect: DOMRect;
  topOffset: number;
}) {
  return params.boundaryRect.bottom - params.topOffset <= params.referenceRect.height + FIXED_EPSILON;
}

export function computeFixedStateSnapshot(params: {
  rect: DOMRect;
  topOffset: number;
}): FixedStateSnapshot {
  const isTopFixed = params.rect.top <= params.topOffset + FIXED_EPSILON;

  return {
    top: isTopFixed,
    bottom: false,
    fixed: isTopFixed
  };
}
