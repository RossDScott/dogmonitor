import { useEffect, useState } from 'react';
import type { GpsLocation } from '../types/status';

export function useGps(active: boolean) {
  const [location, setLocation] = useState<GpsLocation | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!active || !navigator.geolocation) return;

    const id = navigator.geolocation.watchPosition(
      (pos) =>
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      (err) => setError(err.message),
      { enableHighAccuracy: false, timeout: 10000 },
    );

    return () => navigator.geolocation.clearWatch(id);
  }, [active]);

  return { location, error };
}
