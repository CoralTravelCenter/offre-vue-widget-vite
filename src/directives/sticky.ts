import { unref, type Directive, type Ref } from "vue";

type MaybeRef<T> = T | Ref<T>;
export type StickySide = "top" | "bottom" | "both";
export type StickyOffsetValue = string | number | null | undefined;
type StickyScrollTarget = Window | HTMLElement;
type StickyStyleProperty = "position" | "top" | "bottom" | "zIndex" | "left" | "width";

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

interface NormalizedStickyConfig {
  enabled: boolean;
  side: StickySide;
  top: StickyOffsetValue;
  bottom: StickyOffsetValue;
  zIndex: number | string | null | undefined;
  onStick: ((stickyState: StickyStateSnapshot) => void) | null | undefined;
}

interface StickyElementState {
  initial: Record<StickyStyleProperty, string>;
  config: NormalizedStickyConfig;
  lastStickyState: StickyStateSnapshot;
  scrollTargets: StickyScrollTarget[];
  updateListener: (() => void) | null;
  frameId: number;
  placeholder: HTMLDivElement | null;
}

export type StickyBindingValue = boolean | number | string | StickyConfig | null | undefined;

type StickyElement = HTMLElement & {
  __offreStickyState?: StickyElementState;
};

const STICKY_STATE_KEY = "__offreStickyState" as const;
const STICKY_EVENT_NAME = "stick";
const STICKY_EPSILON = 0.5;

const inlineStyleProperties: Record<StickyStyleProperty, string> = {
  position: "position",
  top: "top",
  bottom: "bottom",
  zIndex: "z-index",
  left: "left",
  width: "width"
};

function getRawValue<T>(value: MaybeRef<T> | T) {
  return unref(value);
}

function normalizeLength(value: StickyOffsetValue, fallback: StickyOffsetValue) {
  const raw = getRawValue(value);

  if (raw === null || raw === undefined || raw === "") {
    return fallback === null || fallback === undefined ? "" : `${fallback}px`;
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

function setInlineStyle(el: HTMLElement, property: StickyStyleProperty, value: string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    el.style.removeProperty(inlineStyleProperties[property]);
    return;
  }

  el.style.setProperty(inlineStyleProperties[property], value);
}

function getOrCreateState(el: StickyElement) {
  if (!el[STICKY_STATE_KEY]) {
    el[STICKY_STATE_KEY] = {
      initial: {
        position: el.style.position,
        top: el.style.top,
        bottom: el.style.bottom,
        zIndex: el.style.zIndex,
        left: el.style.left,
        width: el.style.width
      },
      config: normalizeConfig(undefined),
      lastStickyState: { top: false, bottom: false, sticked: false },
      scrollTargets: [],
      updateListener: null,
      frameId: 0,
      placeholder: null
    };
  }

  return el[STICKY_STATE_KEY];
}

function clearStickyStateClasses(el: HTMLElement) {
  el.classList.remove("top-sticky", "bottom-sticky", "sticked");
  el.removeAttribute("data-sticky");
  el.removeAttribute("data-sticky-top");
  el.removeAttribute("data-sticky-bottom");
}

function applyStickyStateClasses(el: HTMLElement, stickyState: StickyStateSnapshot) {
  el.classList.toggle("top-sticky", stickyState.top);
  el.classList.toggle("bottom-sticky", stickyState.bottom);
  el.classList.toggle("sticked", stickyState.sticked);
  el.setAttribute("data-sticky", stickyState.sticked ? "true" : "false");
  el.setAttribute("data-sticky-top", stickyState.top ? "true" : "false");
  el.setAttribute("data-sticky-bottom", stickyState.bottom ? "true" : "false");
}

function createPlaceholder(el: HTMLElement) {
  const placeholder = document.createElement("div");
  const computedStyle = window.getComputedStyle(el);

  placeholder.setAttribute("aria-hidden", "true");
  placeholder.style.display = computedStyle.display === "inline" ? "inline-block" : computedStyle.display;
  placeholder.style.width = `${el.offsetWidth}px`;
  placeholder.style.height = `${el.offsetHeight}px`;
  placeholder.style.margin = computedStyle.margin;
  placeholder.style.padding = "0";
  placeholder.style.border = "0";
  placeholder.style.visibility = "hidden";
  placeholder.style.pointerEvents = "none";
  placeholder.style.flex = computedStyle.flex;
  placeholder.style.alignSelf = computedStyle.alignSelf;
  placeholder.style.gridArea = computedStyle.gridArea;

  return placeholder;
}

function ensurePlaceholder(el: HTMLElement, state: StickyElementState) {
  if (state.placeholder?.isConnected) {
    state.placeholder.style.width = `${el.offsetWidth}px`;
    state.placeholder.style.height = `${el.offsetHeight}px`;
    return state.placeholder;
  }

  const placeholder = createPlaceholder(el);
  el.insertAdjacentElement("afterend", placeholder);
  state.placeholder = placeholder;
  return placeholder;
}

function removePlaceholder(state: StickyElementState) {
  state.placeholder?.remove();
  state.placeholder = null;
}

function restoreInitialStyles(el: HTMLElement, state: StickyElementState) {
  setInlineStyle(el, "position", state.initial.position);
  setInlineStyle(el, "top", state.initial.top);
  setInlineStyle(el, "bottom", state.initial.bottom);
  setInlineStyle(el, "zIndex", state.initial.zIndex);
  setInlineStyle(el, "left", state.initial.left);
  setInlineStyle(el, "width", state.initial.width);
  clearStickyStateClasses(el);
  removePlaceholder(state);
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
  }

  if (state.frameId) {
    cancelAnimationFrame(state.frameId);
    state.frameId = 0;
  }

  state.scrollTargets = [];
  state.updateListener = null;
}

function getAnchorRect(el: HTMLElement, state: StickyElementState) {
  return (state.placeholder ?? el).getBoundingClientRect();
}

function computeStickyState(el: HTMLElement, state: StickyElementState): StickyStateSnapshot {
  const config = state.config;

  if (!config.enabled) {
    return { top: false, bottom: false, sticked: false };
  }

  const rect = getAnchorRect(el, state);
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

function dispatchStickState(el: HTMLElement, config: NormalizedStickyConfig, stickyState: StickyStateSnapshot) {
  if (typeof config.onStick === "function") {
    config.onStick(stickyState);
  }

  el.dispatchEvent(new CustomEvent<StickyStateSnapshot>(STICKY_EVENT_NAME, {
    detail: stickyState,
    bubbles: false
  }));
}

function applyFixedStyles(el: HTMLElement, state: StickyElementState, stickyState: StickyStateSnapshot) {
  if (!stickyState.sticked) {
    restoreInitialStyles(el, state);
    return;
  }

  const placeholder = ensurePlaceholder(el, state);
  const rect = placeholder.getBoundingClientRect();
  const useBottom = stickyState.bottom && !stickyState.top;

  setInlineStyle(el, "position", "fixed");
  setInlineStyle(el, "top", useBottom ? null : normalizeLength(state.config.top, 0));
  setInlineStyle(el, "bottom", useBottom ? normalizeLength(state.config.bottom, 0) : null);
  setInlineStyle(el, "left", `${rect.left}px`);
  setInlineStyle(el, "width", `${rect.width}px`);

  if (state.config.zIndex === null || state.config.zIndex === undefined || state.config.zIndex === "") {
    setInlineStyle(el, "zIndex", null);
  } else {
    setInlineStyle(el, "zIndex", String(state.config.zIndex));
  }
}

function updateStickyState(el: HTMLElement, state: StickyElementState) {
  const nextStickyState = computeStickyState(el, state);

  applyFixedStyles(el, state, nextStickyState);
  applyStickyStateClasses(el, nextStickyState);

  if (areStickyStatesEqual(state.lastStickyState, nextStickyState)) {
    return;
  }

  state.lastStickyState = nextStickyState;
  dispatchStickState(el, state.config, nextStickyState);
}

function bindStickyListeners(el: HTMLElement, state: StickyElementState) {
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
}

function applyStickyStyles(el: StickyElement, rawConfig: StickyBindingValue) {
  const state = getOrCreateState(el);
  const config = normalizeConfig(rawConfig);

  state.config = config;

  if (!config.enabled) {
    unbindStickyListeners(state);
    restoreInitialStyles(el, state);
    updateStickyState(el, state);
    return;
  }

  bindStickyListeners(el, state);
  updateStickyState(el, state);
}

const stickyDirective: Directive<HTMLElement, StickyBindingValue> = {
  mounted(el, binding) {
    applyStickyStyles(el as StickyElement, binding.value);
  },
  updated(el, binding) {
    applyStickyStyles(el as StickyElement, binding.value);
  },
  unmounted(el) {
    const stickyElement = el as StickyElement;
    const state = stickyElement[STICKY_STATE_KEY];

    if (!state) {
      return;
    }

    unbindStickyListeners(state);
    restoreInitialStyles(el, state);
    delete stickyElement[STICKY_STATE_KEY];
  }
};

export default stickyDirective;
