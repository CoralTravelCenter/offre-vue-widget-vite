import { describe, expect, it } from "vitest";
import { createWidgetQueryClient } from "@/app/create-widget-query-client";

describe("createWidgetQueryClient", () => {
  it("does not retry queries unless an endpoint opts in", () => {
    const queryClient = createWidgetQueryClient();

    expect(queryClient.getDefaultOptions().queries?.retry).toBe(0);
  });
});
