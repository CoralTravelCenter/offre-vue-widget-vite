type HostReactAppReadyCallback = (hostElement: HTMLElement) => void;

export interface HostReactAppReadyOptions {
  intervalMs?: number;
  onReady?: HostReactAppReadyCallback;
  timeoutMs?: number;
}

const DEFAULT_INTERVAL_MS = 500;
const DEFAULT_TIMEOUT_MS = 15_000;

function createHostReadyTimeoutError(selector: string, timeoutMs: number) {
  return new Error(
    `OffreWidget: host React app was not ready within ${timeoutMs}ms for selector "${selector}"`,
  );
}

export async function hostReactAppReady(
  selector = "#__next > div",
  options: HostReactAppReadyOptions = {},
): Promise<HTMLElement> {
  const {
    intervalMs = DEFAULT_INTERVAL_MS,
    onReady,
    timeoutMs = DEFAULT_TIMEOUT_MS
  } = options;

  return new Promise<HTMLElement>((resolve, reject) => {
    const startedAt = Date.now();
    let timerId = 0;

    const finishWithError = () => {
      window.clearTimeout(timerId);
      reject(createHostReadyTimeoutError(selector, timeoutMs));
    };

    const waiter = () => {
      const hostElement = document.querySelector<HTMLElement>(selector);

      if (hostElement?.getBoundingClientRect().height) {
        onReady?.(hostElement);
        resolve(hostElement);
        return;
      }

      if (Date.now() - startedAt >= timeoutMs) {
        finishWithError();
        return;
      }

      timerId = window.setTimeout(waiter, intervalMs);
    };

    waiter();
  });
}
