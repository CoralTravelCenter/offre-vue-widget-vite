import { onBeforeUnmount, onMounted, ref, toValue, type MaybeRefOrGetter, type Ref } from "vue";
import { markOffrePerformance, OFFRE_PERFORMANCE_MARKS } from "@/lib/offre-performance";

const WIDGET_VISIBILITY_ROOT_MARGIN = "240px 0px 240px 0px";

export function useOffreWidgetVisibilityState(params: {
  targetRef: Ref<HTMLElement | null>;
  instanceIdSource?: MaybeRefOrGetter<string>;
  rootMargin?: string;
  markVisiblePerformance?: boolean;
}) {
  const hasEnteredViewport = ref(false);
  let observer: IntersectionObserver | null = null;

  function markVisible() {
    hasEnteredViewport.value = true;

    if (params.markVisiblePerformance !== false) {
      markOffrePerformance(OFFRE_PERFORMANCE_MARKS.visible, {
        instanceId: toValue(params.instanceIdSource) ?? ""
      });
    }

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
      rootMargin: params.rootMargin ?? WIDGET_VISIBILITY_ROOT_MARGIN,
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
