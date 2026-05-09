import { useEffect, useRef, useState } from 'react';

export function useWakeLock(active: boolean) {
  const lockRef = useRef<WakeLockSentinel | null>(null);
  const [held, setHeld] = useState(false);

  async function acquire() {
    if (!('wakeLock' in navigator)) return;
    try {
      lockRef.current = await navigator.wakeLock.request('screen');
      lockRef.current.addEventListener('release', () => setHeld(false));
      setHeld(true);
    } catch {
      setHeld(false);
    }
  }

  useEffect(() => {
    if (!active) return;
    acquire();

    const onVisibility = () => {
      if (document.visibilityState === 'visible') acquire();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      lockRef.current?.release();
    };
  }, [active]);

  return held;
}
