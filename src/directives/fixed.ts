import { unref, type Directive, type Ref } from "vue";

type MaybeRef<T> = T | Ref<T>;
export type FixedSide = "top" | "bottom";
export type FixedAlignment = "stretch" | "center";
export type FixedOffsetValue = string | number | null | undefined;
type FixedScrollTarget = Window | HTMLElement;

export interface FixedStateSnapshot {
  top: boolean;
  bottom: boolean;
  fixed: boolean;
}

export interface FixedConfig {
  enabled?: MaybeRef<boolean>;
  disabled?: MaybeRef<boolean>;
  side?: MaybeRef<FixedSide>;
  top?: MaybeRef<FixedOffsetValue>;
  bottom?: MaybeRef<FixedOffsetValue>;
  zIndex?: MaybeRef<number | string | null | undefined>;
  alignment?: MaybeRef<FixedAlignment>;
  onStick?: MaybeRef<((state: FixedStateSnapshot) => void) | null | undefined>;
}

type FixedBindingValue = boolean | number | string | FixedConfig | null | undefined;

interface NormalizedFixedConfig {
  enabled: boolean;
  side: FixedSide;
  top: FixedOffsetValue;
  bottom: FixedOffsetValue;
  zIndex: number | string | null | undefined;
  alignment: FixedAlignment;
  onStick: ((state: FixedStateSnapshot) => void) | null | undefined;
}

interface FixedElementState {
  initial: {
    position: string;
    top: string;
    right: string;
    bottom: string;
    left: string;
    width: string;
    transform: string;
    zIndex: string;
    marginTop: string;
    marginBottom: string;
  };
  config: NormalizedFixedConfig;
  placeholder: HTMLDivElement | null;
  resizeObserver: ResizeObserver | null;
  lastState: FixedStateSnapshot;
  scrollTargets: FixedScrollTarget[];
  updateListener: (() => void) | null;
  frameId: number;
}

type FixedElement = HTMLElement & {
  __offreFixedState?: FixedElementState;
};

const FIXED_STATE_KEY = "__offreFixedState" as const;
const FIXED_EPSILON = 0.5;

function getRawValue<T>(value: MaybeRef<T> | T) {
  return unref(value);
}

function normalizeLength(value: FixedOffsetValue) {
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

function normalizeOffsetNumber(value: FixedOffsetValue, fallback: number) {
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

function normalizeConfig(rawConfig: FixedBindingValue): NormalizedFixedConfig {
  const raw = getRawValue(rawConfig);

  if (raw === false) {
    return {
      enabled: false,
      side: "top",
      top: 0,
      bottom: null,
      zIndex: null,
      alignment: "stretch",
      onStick: null
    };
  }

  if (raw === true || raw === null || raw === undefined) {
    return {
      enabled: true,
      side: "top",
      top: 0,
      bottom: null,
      zIndex: null,
      alignment: "stretch",
      onStick: null
    };
  }

  if (typeof raw === "number" || typeof raw === "string") {
    return {
      enabled: true,
      side: "top",
      top: raw,
      bottom: null,
      zIndex: null,
      alignment: "stretch",
      onStick: null
    };
  }

  const config = typeof raw === "object" ? raw : {};
  const enabled = config.disabled ? false : getRawValue(config.enabled) !== false;
  const top = getRawValue(config.top);
  const bottom = getRawValue(config.bottom);
  const zIndex = getRawValue(config.zIndex);
  const onStick = getRawValue(config.onStick);
  const alignment = getRawValue(config.alignment) === "center" ? "center" : "stretch";
  let side: FixedSide | undefined = getRawValue(config.side);

  if (!["top", "bottom"].includes(side ?? "")) {
    side = bottom !== null && bottom !== undefined && (top === null || top === undefined)
      ? "bottom"
      : "top";
  }

  return { enabled, side: side ?? "top", top, bottom, zIndex, alignment, onStick };
}

function collectScrollTargets(el: HTMLElement) {
  const targets: FixedScrollTarget[] = [];
  let parent = el.parentElement;

  while (parent) {
    const styles = window.getComputedStyle(parent);
    const overflow = `${styles.overflow} ${styles.overflowX} ${styles.overflowY}`.toLowerCase();

    if (overflow.includes("auto") || overflow.includes("scroll") || overflow.includes("overlay")) {
      targets.push(parent);
    }

    parent = parent.parentElement;
  }

  targets.push(window);
  return Array.from(new Set(targets));
}

function getOrCreateState(el: FixedElement) {
  if (!el[FIXED_STATE_KEY]) {
    el[FIXED_STATE_KEY] = {
      initial: {
        position: el.style.position,
        top: el.style.top,
        right: el.style.right,
        bottom: el.style.bottom,
        left: el.style.left,
        width: el.style.width,
        transform: el.style.transform,
        zIndex: el.style.zIndex,
        marginTop: el.style.marginTop,
        marginBottom: el.style.marginBottom
      },
      config: normalizeConfig(undefined),
      placeholder: null,
      resizeObserver: null,
      lastState: { top: false, bottom: false, fixed: false },
      scrollTargets: [],
      updateListener: null,
      frameId: 0
    };
  }

  return el[FIXED_STATE_KEY];
}

function ensurePlaceholder(el: HTMLElement, state: FixedElementState) {
  if (state.placeholder) {
    return state.placeholder;
  }

  const placeholder = document.createElement("div");
  placeholder.setAttribute("aria-hidden", "true");
  placeholder.style.display = "none";
  el.insertAdjacentElement("afterend", placeholder);
  state.placeholder = placeholder;
  return placeholder;
}

function restoreInitialStyles(el: FixedElement, state: FixedElementState) {
  el.style.position = state.initial.position;
  el.style.top = state.initial.top;
  el.style.right = state.initial.right;
  el.style.bottom = state.initial.bottom;
  el.style.left = state.initial.left;
  el.style.width = state.initial.width;
  el.style.transform = state.initial.transform;
  el.style.zIndex = state.initial.zIndex;
  el.style.marginTop = state.initial.marginTop;
  el.style.marginBottom = state.initial.marginBottom;
  el.classList.remove("top-fixed", "bottom-fixed", "fixeded", "sticked");
  el.removeAttribute("data-fixed");
}

function hidePlaceholder(state: FixedElementState) {
  if (!state.placeholder) {
    return;
  }

  state.placeholder.style.display = "none";
  state.placeholder.style.height = "";
  state.placeholder.style.marginTop = "";
  state.placeholder.style.marginBottom = "";
}

function syncPlaceholder(el: HTMLElement, placeholder: HTMLDivElement) {
  const rect = el.getBoundingClientRect();
  const styles = window.getComputedStyle(el);

  placeholder.style.display = "block";
  placeholder.style.height = `${rect.height}px`;
  placeholder.style.marginTop = styles.marginTop;
  placeholder.style.marginBottom = styles.marginBottom;
}

function applyStateClasses(el: HTMLElement, fixedState: FixedStateSnapshot) {
  el.classList.toggle("top-fixed", fixedState.top);
  el.classList.toggle("bottom-fixed", fixedState.bottom);
  el.classList.toggle("fixeded", fixedState.fixed);
  el.classList.toggle("sticked", fixedState.fixed);
  el.setAttribute("data-fixed", fixedState.fixed ? "true" : "false");
}

function areStatesEqual(previousState: FixedStateSnapshot, nextState: FixedStateSnapshot) {
  return previousState.top === nextState.top
    && previousState.bottom === nextState.bottom
    && previousState.fixed === nextState.fixed;
}

function getReferenceRect(el: HTMLElement, state: FixedElementState) {
  return (state.placeholder?.style.display === "block" ? state.placeholder : el).getBoundingClientRect();
}

function computeState(el: HTMLElement, state: FixedElementState): FixedStateSnapshot {
  const config = state.config;

  if (!config.enabled) {
    return { top: false, bottom: false, fixed: false };
  }

  const rect = getReferenceRect(el, state);
  const topOffset = normalizeOffsetNumber(config.top, 0);
  const bottomOffset = normalizeOffsetNumber(config.bottom, 0);
  const isTopFixed = config.side === "top" && rect.top <= topOffset + FIXED_EPSILON;
  const isBottomFixed = config.side === "bottom" && window.innerHeight - rect.bottom <= bottomOffset + FIXED_EPSILON;

  return {
    top: isTopFixed,
    bottom: isBottomFixed,
    fixed: isTopFixed || isBottomFixed
  };
}

function applyFixedStyles(el: FixedElement, state: FixedElementState) {
  const config = state.config;
  const placeholder = ensurePlaceholder(el, state);

  syncPlaceholder(el, placeholder);

  const rect = placeholder.getBoundingClientRect();
  const width = `${rect.width}px`;

  el.style.position = "fixed";
  el.style.zIndex = config.zIndex === null || config.zIndex === undefined || config.zIndex === ""
    ? ""
    : String(config.zIndex);
  el.style.top = config.side === "top" ? normalizeLength(config.top) : "";
  el.style.bottom = config.side === "bottom" ? normalizeLength(config.bottom) : "";
  el.style.right = "";
  el.style.marginTop = "0";
  el.style.marginBottom = "0";

  if (config.alignment === "center") {
    el.style.left = `${rect.left + rect.width / 2}px`;
    el.style.width = width;
    el.style.transform = "translateX(-50%)";
    return;
  }

  el.style.left = `${rect.left}px`;
  el.style.width = width;
  el.style.transform = "";
}

function dispatchState(config: NormalizedFixedConfig, fixedState: FixedStateSnapshot) {
  if (typeof config.onStick === "function") {
    config.onStick(fixedState);
  }
}

function updateFixedState(el: FixedElement, state: FixedElementState) {
  const nextState = computeState(el, state);

  if (nextState.fixed) {
    applyFixedStyles(el, state);
  } else {
    hidePlaceholder(state);
    restoreInitialStyles(el, state);
  }

  applyStateClasses(el, nextState);

  if (areStatesEqual(state.lastState, nextState)) {
    return;
  }

  state.lastState = nextState;
  dispatchState(state.config, nextState);
}

function unbindListeners(state: FixedElementState) {
  state.resizeObserver?.disconnect();
  state.resizeObserver = null;

  if (state.updateListener) {
    state.scrollTargets.forEach((target) => {
      target.removeEventListener("scroll", state.updateListener as EventListener);
    });
    window.removeEventListener("resize", state.updateListener as EventListener);
  }

  if (state.frameId) {
    cancelAnimationFrame(state.frameId);
    state.frameId = 0;
  }

  state.scrollTargets = [];
  state.updateListener = null;
}

function bindListeners(el: FixedElement, state: FixedElementState) {
  if (state.updateListener) {
    return;
  }

  state.updateListener = () => {
    if (state.frameId) {
      return;
    }

    state.frameId = requestAnimationFrame(() => {
      state.frameId = 0;
      updateFixedState(el, state);
    });
  };

  state.scrollTargets = collectScrollTargets(el);
  state.scrollTargets.forEach((target) => {
    target.addEventListener("scroll", state.updateListener as EventListener, { passive: true });
  });
  window.addEventListener("resize", state.updateListener as EventListener, { passive: true });

  if (typeof ResizeObserver !== "undefined") {
    state.resizeObserver = new ResizeObserver(() => {
      state.updateListener?.();
    });
    state.resizeObserver.observe(el);
  }
}

function applyFixed(el: FixedElement, rawConfig: FixedBindingValue) {
  const state = getOrCreateState(el);
  const config = normalizeConfig(rawConfig);

  state.config = config;

  if (!config.enabled) {
    unbindListeners(state);
    hidePlaceholder(state);
    restoreInitialStyles(el, state);
    state.lastState = { top: false, bottom: false, fixed: false };
    return;
  }

  ensurePlaceholder(el, state);
  bindListeners(el, state);
  updateFixedState(el, state);
}

const fixedDirective: Directive<HTMLElement, FixedBindingValue> = {
  mounted(el, binding) {
    applyFixed(el as FixedElement, binding.value);
  },
  updated(el, binding) {
    applyFixed(el as FixedElement, binding.value);
  },
  unmounted(el) {
    const fixedElement = el as FixedElement;
    const state = fixedElement[FIXED_STATE_KEY];

    if (!state) {
      return;
    }

    unbindListeners(state);
    hidePlaceholder(state);
    state.placeholder?.remove();
    restoreInitialStyles(fixedElement, state);
    delete fixedElement[FIXED_STATE_KEY];
  }
};

export default fixedDirective;
