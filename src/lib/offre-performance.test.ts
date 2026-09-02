import { afterEach, describe, expect, it, vi } from "vitest";
import {
  markOffrePerformance,
  OFFRE_PERFORMANCE_MARKS
} from "@/lib/offre-performance";

describe("offre performance marks", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("records a named mark with structured details", () => {
    const mark = vi.spyOn(performance, "mark").mockImplementation(() => ({} as PerformanceMark));

    markOffrePerformance(OFFRE_PERFORMANCE_MARKS.mounted, {
      instanceId: "widget-1"
    });

    expect(mark).toHaveBeenCalledWith(OFFRE_PERFORMANCE_MARKS.mounted, {
      detail: {
        instanceId: "widget-1"
      }
    });
  });

  it("falls back to a detail-free mark for older hosts", () => {
    const mark = vi.spyOn(performance, "mark")
      .mockImplementationOnce(() => {
        throw new TypeError("mark options are unsupported");
      })
      .mockImplementation(() => ({} as PerformanceMark));

    markOffrePerformance(OFFRE_PERFORMANCE_MARKS.visible);

    expect(mark).toHaveBeenNthCalledWith(1, OFFRE_PERFORMANCE_MARKS.visible, { detail: {} });
    expect(mark).toHaveBeenNthCalledWith(2, OFFRE_PERFORMANCE_MARKS.visible);
  });
});
