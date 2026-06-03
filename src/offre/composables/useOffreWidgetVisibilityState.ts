import { onBeforeUnmount, onMounted, ref, type Ref } from "vue";

const WIDGET_VISIBILITY_ROOT_MARGIN = "240px 0px 240px 0px";

export function useOffreWidgetVisibilityState(params: {
  targetRef: Ref<HTMLElement | null>;
}) {
  const hasEnteredViewport = ref(false);
  let observer: IntersectionObserver | null = null;

  function markVisible() {
    hasEnteredViewport.value = true;
    observer?.disconnect();
    observer = null;
  }

  onMounted(() => {
    const target = params.targetRef.value;

    if (hasEnteredViewport.value || !target) {
      return;
    }

    if (typeof window === "undefined" || typeof window.IntersectionObserver !== "function") {
      markVisible();
      return;
    }

    observer = new window.IntersectionObserver((entries) => {
      const targetEntry = entries.find((entry) => entry.target === target);

      if (targetEntry?.isIntersecting) {
        markVisible();
      }
    }, {
      root: null,
      rootMargin: WIDGET_VISIBILITY_ROOT_MARGIN,
      threshold: 0
    });

    observer.observe(target);
  });

  onBeforeUnmount(() => {
    observer?.disconnect();
    observer = null;
  });

  return {
    hasEnteredViewport
  };
}
