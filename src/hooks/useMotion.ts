import { useEffect, useRef, useState } from 'react';

export function useMotion(active: boolean) {
  const [magnitude, setMagnitude] = useState(0);
  const [supported, setSupported] = useState(true);
  const lastEventRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;
    if (!('DeviceMotionEvent' in window)) { setSupported(false); return; }

    function onMotion(e: DeviceMotionEvent) {
      const a = e.acceleration;
      if (!a) return;
      const now = Date.now();
      if (now - lastEventRef.current < 200) return;
      lastEventRef.current = now;
      const mag = Math.sqrt((a.x ?? 0) ** 2 + (a.y ?? 0) ** 2 + (a.z ?? 0) ** 2);
      setMagnitude(mag);
    }

    window.addEventListener('devicemotion', onMotion);
    return () => window.removeEventListener('devicemotion', onMotion);
  }, [active]);

  return { magnitude, supported };
}
