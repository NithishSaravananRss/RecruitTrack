type BackendReadinessStatus = 'checking' | 'ready' | 'unavailable';

export interface BackendReadinessSnapshot {
  status: BackendReadinessStatus;
  attempt: number;
  maxAttempts: number;
  nextRetryInMs?: number;
}

const REQUEST_TIMEOUT_MS = 6000;
const RETRY_DELAYS_MS = [1000, 2000, 4000, 6000, 8000, 8000, 8000];
const MAX_ATTEMPTS = RETRY_DELAYS_MS.length + 1;

let inFlight: Promise<boolean> | null = null;
let cachedResult: boolean | null = null;

function getHealthUrl() {
  const baseUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/$/, '');
  if (!baseUrl) {
    throw new Error('VITE_API_URL is not configured');
  }
  return `${baseUrl}/api/v1/health`;
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function probeHealth(): Promise<{ ready: boolean; retryable: boolean }> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(getHealthUrl(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
      signal: controller.signal,
    });

    if (response.status === 502 || response.status === 503 || response.status === 504) {
      return { ready: false, retryable: true };
    }

    if (!response.ok) {
      return { ready: false, retryable: false };
    }

    const payload = await response.json().catch(() => null);
    const backendStatus = payload?.data?.status ?? payload?.status;
    return { ready: backendStatus === 'UP', retryable: backendStatus !== 'UP' };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return { ready: false, retryable: true };
    }
    return { ready: false, retryable: true };
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function waitForBackendReady(
  onSnapshot?: (snapshot: BackendReadinessSnapshot) => void,
): Promise<boolean> {
  if (cachedResult === true) {
    return true;
  }

  if (cachedResult === false) {
    return false;
  }

  if (inFlight) {
    return inFlight;
  }

  inFlight = (async () => {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      onSnapshot?.({ status: 'checking', attempt, maxAttempts: MAX_ATTEMPTS });

      const result = await probeHealth();
      if (result.ready) {
        cachedResult = true;
        onSnapshot?.({ status: 'ready', attempt, maxAttempts: MAX_ATTEMPTS });
        return true;
      }

      if (!result.retryable || attempt === MAX_ATTEMPTS) {
        break;
      }

      const nextRetryInMs = RETRY_DELAYS_MS[attempt - 1] ?? RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1];
      onSnapshot?.({
        status: 'checking',
        attempt,
        maxAttempts: MAX_ATTEMPTS,
        nextRetryInMs,
      });
      await sleep(nextRetryInMs);
    }

    cachedResult = false;
    onSnapshot?.({ status: 'unavailable', attempt: MAX_ATTEMPTS, maxAttempts: MAX_ATTEMPTS });
    return false;
  })().finally(() => {
    inFlight = null;
  });

  return inFlight;
}
