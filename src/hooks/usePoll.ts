import { useCallback, useEffect, useRef, useState } from 'react';

export function usePoll(fn: () => Promise<void>, intervalSec: number) {
  const [lastPollTime, setLastPollTime] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const poll = useCallback(async () => {
    if (isPending) return;
    setIsPending(true);
    try {
      await fnRef.current();
      setLastPollTime(new Date().toISOString());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsPending(false);
    }
  }, [isPending]);

  useEffect(() => {
    poll();
    const id = setInterval(poll, intervalSec * 1000);
    return () => clearInterval(id);
  }, [intervalSec]);

  return { lastPollTime, isPending, error, pollNow: poll };
}
