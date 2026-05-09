export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 5,
  baseDelayMs = 1000,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts - 1) {
        const jitter = Math.random() * baseDelayMs;
        await delay(baseDelayMs * Math.pow(2, attempt) + jitter);
      }
    }
  }
  throw lastError;
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
