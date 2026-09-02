export const OFFRE_PERFORMANCE_MARKS = {
  mounted: "offre:mounted",
  visible: "offre:visible",
  bootstrapReady: "offre:bootstrap-ready",
  productsRequestStart: "offre:products-request-start",
  productsRequestEnd: "offre:products-request-end",
  firstCardRendered: "offre:first-card-rendered",
  firstImageLoaded: "offre:first-image-loaded"
} as const;

export type OffrePerformanceMark = typeof OFFRE_PERFORMANCE_MARKS[keyof typeof OFFRE_PERFORMANCE_MARKS];

export function markOffrePerformance(
  name: OffrePerformanceMark,
  detail: Record<string, unknown> = {}
) {
  if (typeof performance === "undefined" || typeof performance.mark !== "function") {
    return;
  }

  try {
    performance.mark(name, { detail });
  } catch {
    // Older host browsers may support marks without the detail option.
    performance.mark(name);
  }
}
