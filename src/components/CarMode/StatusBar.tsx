import type { QueueStatus } from '../../services/uploadQueue';

interface Props {
  queueStatus: QueueStatus;
  wakeLockHeld: boolean;
  eventCount: number;
  location: { lat: number; lng: number } | null;
}

export function StatusBar({ queueStatus, wakeLockHeld, eventCount, location }: Props) {
  return (
    <div className="status-bar">
      <span title={wakeLockHeld ? 'Screen lock active' : 'Screen lock not held'}>
        {wakeLockHeld ? '🔒 Awake' : '⚠️ No wake lock'}
      </span>
      <span>
        {queueStatus.pending > 0
          ? `Uploading (${queueStatus.pending} queued)`
          : queueStatus.lastError
            ? `Upload error`
            : queueStatus.lastSuccess
              ? `Synced`
              : 'Idle'}
      </span>
      {eventCount > 0 && <span className="event-badge">{eventCount} events</span>}
      {location && (
        <a
          href={`https://maps.google.com/?q=${location.lat},${location.lng}`}
          target="_blank"
          rel="noreferrer"
          className="gps-link"
        >
          GPS
        </a>
      )}
    </div>
  );
}
