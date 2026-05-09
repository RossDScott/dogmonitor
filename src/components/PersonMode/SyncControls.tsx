import { useState } from 'react';

interface Props {
  lastPollTime: string | null;
  isPending: boolean;
  error: string | null;
  onRefresh: () => void;
  lastUpdate: string | null;
  location: { lat: number; lng: number } | null;
}

export function SyncControls({ lastPollTime, isPending, error, onRefresh, lastUpdate, location }: Props) {
  const [showMap, setShowMap] = useState(false);

  return (
    <div className="sync-controls">
      <div className="sync-row">
        <span>
          {isPending
            ? 'Syncing...'
            : lastPollTime
              ? `Checked ${new Date(lastPollTime).toLocaleTimeString()}`
              : 'Not yet synced'}
        </span>
        <button className="btn-refresh" onClick={onRefresh} disabled={isPending}>
          Refresh
        </button>
      </div>
      {lastUpdate && (
        <div className="car-update">
          Car last updated: {new Date(lastUpdate).toLocaleTimeString()}
        </div>
      )}
      {location && (
        <>
          <button className="gps-link" onClick={() => setShowMap(v => !v)}>
            {showMap ? 'Hide map' : 'View car location'}
          </button>
          {showMap && (
            <iframe
              className="map-embed"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.lng - 0.005},${location.lat - 0.005},${location.lng + 0.005},${location.lat + 0.005}&layer=mapnik&marker=${location.lat},${location.lng}`}
              title="Car location"
              loading="lazy"
            />
          )}
        </>
      )}
      {error && <div className="sync-error">{error}</div>}
    </div>
  );
}
