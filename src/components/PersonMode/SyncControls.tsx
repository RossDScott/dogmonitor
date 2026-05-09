interface Props {
  lastPollTime: string | null;
  isPending: boolean;
  error: string | null;
  onRefresh: () => void;
  lastUpdate: string | null;
  location: { lat: number; lng: number } | null;
}

export function SyncControls({ lastPollTime, isPending, error, onRefresh, lastUpdate, location }: Props) {
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
        <a
          href={`https://maps.google.com/?q=${location.lat},${location.lng}`}
          target="_blank"
          rel="noreferrer"
          className="gps-link"
        >
          View car location
        </a>
      )}
      {error && <div className="sync-error">{error}</div>}
    </div>
  );
}
