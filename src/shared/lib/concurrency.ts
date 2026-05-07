export async function runConcurrentTasks<TValue>(
  tasks: Array<() => Promise<TValue>>,
  concurrency: number
) {
  const results: TValue[] = new Array(tasks.length);
  let cursor = 0;

  async function worker() {
    while (cursor < tasks.length) {
      const taskIndex = cursor;
      cursor += 1;
      results[taskIndex] = await tasks[taskIndex]();
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(Math.max(concurrency, 1), tasks.length || 1) }, () => worker())
  );

  return results;
}

export async function runConcurrentSettledTasks<TValue>(
  tasks: Array<() => Promise<TValue>>,
  concurrency: number
) {
  const results: Array<PromiseSettledResult<TValue>> = new Array(tasks.length);
  let cursor = 0;

  async function worker() {
    while (cursor < tasks.length) {
      const taskIndex = cursor;
      cursor += 1;

      try {
        results[taskIndex] = {
          status: "fulfilled",
          value: await tasks[taskIndex]()
        };
      } catch (error) {
        results[taskIndex] = {
          status: "rejected",
          reason: error
        };
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(Math.max(concurrency, 1), tasks.length || 1) }, () => worker())
  );

  return results;
}
