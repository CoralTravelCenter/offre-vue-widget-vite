import { type Directive } from "vue";
import {
  applyFixedStateClasses,
  areFixedStatesEqual,
  computeFixedStateSnapshot,
  normalizeFixedConfig,
  normalizeLength,
  normalizeOffsetNumber,
  resolveFixedBoundaryElement,
  shouldAnchorFixedToBoundaryBottom,
  type FixedBindingValue,
  type FixedStateSnapshot,
  type NormalizedFixedConfig
} from "@/app/fixed-directive.helpers";

type FixedScrollTarget = Window | HTMLElement;

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
      config: normalizeFixedConfig(undefined),
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

function getReferenceRect(el: HTMLElement, state: FixedElementState) {
  return (state.placeholder?.style.display === "block" ? state.placeholder : el).getBoundingClientRect();
}

function shouldAnchorToBoundaryBottom(
  el: HTMLElement,
  state: FixedElementState,
  topOffset: number
) {
  const boundary = resolveFixedBoundaryElement(el);

  if (!boundary) {
    return false;
  }

  return shouldAnchorFixedToBoundaryBottom({
    boundaryRect: boundary.getBoundingClientRect(),
    referenceRect: getReferenceRect(el, state),
    topOffset
  });
}

function computeState(el: HTMLElement, state: FixedElementState): FixedStateSnapshot {
  return computeFixedStateSnapshot({
    rect: getReferenceRect(el, state),
    topOffset: normalizeOffsetNumber(state.config.top, 0)
  });
}

function applyFixedStyles(el: FixedElement, state: FixedElementState) {
  const placeholder = ensurePlaceholder(el, state);

  syncPlaceholder(el, placeholder);

  const rect = placeholder.getBoundingClientRect();
  const width = `${rect.width}px`;

  el.style.position = "fixed";
  el.style.zIndex = state.config.zIndex === null || state.config.zIndex === undefined || state.config.zIndex === ""
    ? ""
    : String(state.config.zIndex);
  el.style.top = normalizeLength(state.config.top);
  el.style.bottom = "";
  el.style.right = "";
  el.style.marginTop = "0";
  el.style.marginBottom = "0";

  el.style.left = `${rect.left}px`;
  el.style.width = width;
  el.style.transform = "";
}

function applyBoundaryBottomStyles(el: FixedElement, state: FixedElementState) {
  const placeholder = ensurePlaceholder(el, state);
  const boundary = resolveFixedBoundaryElement(el);

  if (!boundary) {
    applyFixedStyles(el, state);
    return;
  }

  syncPlaceholder(el, placeholder);

  const rect = placeholder.getBoundingClientRect();
  const width = `${rect.width}px`;
  const top = Math.max(0, boundary.offsetHeight - rect.height);

  el.style.position = "absolute";
  el.style.top = `${top}px`;
  el.style.right = "";
  el.style.bottom = "";
  el.style.left = "0";
  el.style.width = width;
  el.style.transform = "";
  el.style.marginTop = "0";
  el.style.marginBottom = "0";
  el.style.zIndex = state.config.zIndex === null || state.config.zIndex === undefined || state.config.zIndex === ""
    ? ""
    : String(state.config.zIndex);
}

function dispatchState(config: NormalizedFixedConfig, fixedState: FixedStateSnapshot) {
  if (typeof config.onStick === "function") {
    config.onStick(fixedState);
  }
}

function updateFixedState(el: FixedElement, state: FixedElementState) {
  const nextState = computeState(el, state);

  if (nextState.fixed) {
    if (shouldAnchorToBoundaryBottom(el, state, normalizeOffsetNumber(state.config.top, 0))) {
      applyBoundaryBottomStyles(el, state);
    } else {
      applyFixedStyles(el, state);
    }
  } else {
    hidePlaceholder(state);
    restoreInitialStyles(el, state);
  }

  applyFixedStateClasses(el, nextState);

  if (areFixedStatesEqual(state.lastState, nextState)) {
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
  const config = normalizeFixedConfig(rawConfig);

  state.config = config;

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

export type {
  FixedBindingValue,
  FixedConfig,
  FixedOffsetValue,
  FixedStateSnapshot,
  NormalizedFixedConfig
} from "@/app/fixed-directive.helpers";

export default fixedDirective;
