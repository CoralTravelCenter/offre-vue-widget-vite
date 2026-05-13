import { describe, expect, it } from "vitest";
import { runConcurrentSettledTasks, runConcurrentTasks } from "@/lib/concurrency";

describe("runConcurrentTasks", () => {
  it("preserves input order", async () => {
    const results = await runConcurrentTasks([
      async () => 1,
      async () => 2,
      async () => 3
    ], 2);

    expect(results).toEqual([1, 2, 3]);
  });
});

describe("runConcurrentSettledTasks", () => {
  it("returns settled states without throwing", async () => {
    const results = await runConcurrentSettledTasks([
      async () => "ok",
      async () => {
        throw new Error("boom");
      }
    ], 2);

    expect(results[0]).toMatchObject({ status: "fulfilled", value: "ok" });
    expect(results[1]?.status).toBe("rejected");
  });
});
