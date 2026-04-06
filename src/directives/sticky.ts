import { unref, type Directive, type Ref } from "vue";

type MaybeRef<T> = T | Ref<T>;
export type StickySide = "top" | "bottom" | "both";
export type StickyOffsetValue = string | number | null | undefined;
type StickyScrollTarget = Window | HTMLElement;

export interface StickyStateSnapshot {
  top: boolean;
  bottom: boolean;
  sticked: boolean;
}

export interface StickyConfig {
  enabled?: MaybeRef<boolean>;
  disabled?: MaybeRef<boolean>;
  side?: MaybeRef<StickySide>;
  top?: MaybeRef<StickyOffsetValue>;
  bottom?: MaybeRef<StickyOffsetValue>;
  zIndex?: MaybeRef<number | string | null | undefined>;
  onStick?: MaybeRef<((stickyState: StickyStateSnapshot) => void) | null | undefined>;
}

type StickyBindingValue = boolean | number | string | StickyConfig | null | undefined;

interface NormalizedStickyConfig {
  enabled: boolean;
  side: StickySide;
  top: StickyOffsetValue;
  bottom: StickyOffsetValue;
  zIndex: number | string | null | undefined;
  onStick: ((stickyState: StickyStateSnapshot) => void) | null | undefined;
}

interface StickyElementState {
  initial: {
    position: string;
    top: string;
    bottom: string;
    zIndex: string;
  };
  config: NormalizedStickyConfig;
  lastStickyState: StickyStateSnapshot;
  scrollTargets: StickyScrollTarget[];
  updateListener: (() => void) | null;
  frameId: number;
}

type StickyElement = HTMLElement & {
  __offreStickyState?: StickyElementState;
};

const STICKY_STATE_KEY = "__offreStickyState" as const;
const STICKY_EVENT_NAME = "stick";
const STICKY_EPSILON = 0.5;

function getRawValue<T>(value: MaybeRef<T> | T) {
  return unref(value);
}

function normalizeLength(value: StickyOffsetValue) {
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

function normalizeOffsetNumber(value: StickyOffsetValue, fallback: number) {
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

function normalizeConfig(rawConfig: StickyBindingValue): NormalizedStickyConfig {
  const raw = getRawValue(rawConfig);

  if (raw === false) {
    return { enabled: false, side: "top", top: 0, bottom: null, zIndex: null, onStick: null };
  }

  if (raw === true || raw === null || raw === undefined) {
    return { enabled: true, side: "top", top: 0, bottom: null, zIndex: null, onStick: null };
  }

  if (typeof raw === "number" || typeof raw === "string") {
    return { enabled: true, side: "top", top: raw, bottom: null, zIndex: null, onStick: null };
  }

  const config = typeof raw === "object" ? raw : {};
  const enabled = config.disabled ? false : getRawValue(config.enabled) !== false;
  const top = getRawValue(config.top);
  const bottom = getRawValue(config.bottom);
  const zIndex = getRawValue(config.zIndex);
  const onStick = getRawValue(config.onStick);
  let side: StickySide | undefined = getRawValue(config.side);

  if (!["top", "bottom", "both"].includes(side ?? "")) {
    if (top !== null && top !== undefined && bottom !== null && bottom !== undefined) {
      side = "both";
    } else if (bottom !== null && bottom !== undefined && (top === null || top === undefined)) {
      side = "bottom";
    } else {
      side = "top";
    }
  }

  return { enabled, side: side ?? "top", top, bottom, zIndex, onStick };
}

function getOrCreateState(el: StickyElement) {
  if (!el[STICKY_STATE_KEY]) {
    el[STICKY_STATE_KEY] = {
      initial: {
        position: el.style.position,
        top: el.style.top,
        bottom: el.style.bottom,
        zIndex: el.style.zIndex
      },
      config: normalizeConfig(undefined),
      lastStickyState: { top: false, bottom: false, sticked: false },
      scrollTargets: [],
      updateListener: null,
      frameId: 0
    };
  }

  return el[STICKY_STATE_KEY];
}

function applyStickyStateClasses(el: HTMLElement, stickyState: StickyStateSnapshot) {
  el.classList.toggle("top-sticky", stickyState.top);
  el.classList.toggle("bottom-sticky", stickyState.bottom);
  el.classList.toggle("sticked", stickyState.sticked);
  el.setAttribute("data-sticky", stickyState.sticked ? "true" : "false");
  el.setAttribute("data-sticky-top", stickyState.top ? "true" : "false");
  el.setAttribute("data-sticky-bottom", stickyState.bottom ? "true" : "false");
}

function clearStickyStateClasses(el: HTMLElement) {
  el.classList.remove("top-sticky", "bottom-sticky", "sticked");
  el.removeAttribute("data-sticky");
  el.removeAttribute("data-sticky-top");
  el.removeAttribute("data-sticky-bottom");
}

function restoreInitialStyles(el: StickyElement, state: StickyElementState) {
  el.style.position = state.initial.position;
  el.style.top = state.initial.top;
  el.style.bottom = state.initial.bottom;
  el.style.zIndex = state.initial.zIndex;
  clearStickyStateClasses(el);
}

function areStickyStatesEqual(prevState: StickyStateSnapshot, nextState: StickyStateSnapshot) {
  return prevState.top === nextState.top
    && prevState.bottom === nextState.bottom
    && prevState.sticked === nextState.sticked;
}

function collectScrollTargets(el: HTMLElement) {
  const targets: StickyScrollTarget[] = [];
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

function unbindStickyListeners(state: StickyElementState) {
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

function computeStickyState(el: HTMLElement, state: StickyElementState): StickyStateSnapshot {
  const config = state.config;

  if (!config.enabled) {
    return { top: false, bottom: false, sticked: false };
  }

  const rect = el.getBoundingClientRect();
  const topOffset = normalizeOffsetNumber(config.top, 0);
  const bottomOffset = normalizeOffsetNumber(config.bottom, 0);
  const isTopSticky = (config.side === "top" || config.side === "both")
    && rect.top <= topOffset + STICKY_EPSILON;
  const isBottomSticky = (config.side === "bottom" || config.side === "both")
    && window.innerHeight - rect.bottom <= bottomOffset + STICKY_EPSILON;

  return {
    top: isTopSticky,
    bottom: isBottomSticky,
    sticked: isTopSticky || isBottomSticky
  };
}

function dispatchStickState(el: StickyElement, config: NormalizedStickyConfig, stickyState: StickyStateSnapshot) {
  if (typeof config.onStick === "function") {
    config.onStick(stickyState);
  }

  el.dispatchEvent(new CustomEvent<StickyStateSnapshot>(STICKY_EVENT_NAME, {
    detail: stickyState,
    bubbles: false
  }));
}

function updateStickyState(el: StickyElement, state: StickyElementState) {
  const nextStickyState = computeStickyState(el, state);

  applyStickyStateClasses(el, nextStickyState);

  if (areStickyStatesEqual(state.lastStickyState, nextStickyState)) {
    return;
  }

  state.lastStickyState = nextStickyState;
  dispatchStickState(el, state.config, nextStickyState);
}

function bindStickyListeners(el: StickyElement, state: StickyElementState) {
  if (state.updateListener) {
    return;
  }

  state.updateListener = () => {
    if (state.frameId) {
      return;
    }

    state.frameId = requestAnimationFrame(() => {
      state.frameId = 0;
      updateStickyState(el, state);
    });
  };

  state.scrollTargets = collectScrollTargets(el);
  state.scrollTargets.forEach((target) => {
    target.addEventListener("scroll", state.updateListener as EventListener, { passive: true });
  });
  window.addEventListener("resize", state.updateListener as EventListener, { passive: true });
}

function applySticky(el: StickyElement, rawConfig: StickyBindingValue) {
  const state = getOrCreateState(el);
  const config = normalizeConfig(rawConfig);

  state.config = config;

  if (!config.enabled) {
    unbindStickyListeners(state);
    restoreInitialStyles(el, state);
    updateStickyState(el, state);
    return;
  }

  el.style.position = "sticky";
  el.style.top = config.side === "bottom" ? "" : normalizeLength(config.top);
  el.style.bottom = config.side === "top" ? "" : normalizeLength(config.bottom);
  el.style.zIndex = config.zIndex === null || config.zIndex === undefined || config.zIndex === ""
    ? ""
    : String(config.zIndex);

  bindStickyListeners(el, state);
  updateStickyState(el, state);
}

const stickyDirective: Directive<HTMLElement, StickyBindingValue> = {
  mounted(el, binding) {
    applySticky(el as StickyElement, binding.value);
  },
  updated(el, binding) {
    applySticky(el as StickyElement, binding.value);
  },
  unmounted(el) {
    const stickyElement = el as StickyElement;
    const state = stickyElement[STICKY_STATE_KEY];

    if (!state) {
      return;
    }

    unbindStickyListeners(state);
    restoreInitialStyles(stickyElement, state);
    delete stickyElement[STICKY_STATE_KEY];
  }
};

export default stickyDirective;
