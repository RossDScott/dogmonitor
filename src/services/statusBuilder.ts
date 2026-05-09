import type { GpsLocation, MonitorEvent, StatusJson } from '../types/status';
import { nowIso, isOlderThan } from '../utils/time';

const ONE_HOUR = 60 * 60 * 1000;

export function buildStatus(
  sessionStart: string,
  location: GpsLocation | null,
  latestPhoto: string | null,
  photoHistory: string[],
  audioHistory: string[],
  events: MonitorEvent[],
): StatusJson {
  const recentEvents = events.filter((e) => !isOlderThan(e.time, ONE_HOUR));
  const recentPhotos = photoHistory.slice(-60);
  const recentAudio = audioHistory.slice(-20);

  return {
    schemaVersion: 1,
    lastUpdate: nowIso(),
    sessionStart,
    location,
    latestPhoto,
    photoHistory: recentPhotos,
    audioHistory: recentAudio,
    events: recentEvents,
  };
}
