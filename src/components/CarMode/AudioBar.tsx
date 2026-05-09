interface Props {
  dbLevel: number;
  threshold: number;
}

export function AudioBar({ dbLevel, threshold }: Props) {
  const MIN_DB = -60;
  const MAX_DB = 0;
  const pct = Math.max(0, Math.min(100, ((dbLevel - MIN_DB) / (MAX_DB - MIN_DB)) * 100));
  const thresholdPct = Math.max(0, Math.min(100, ((threshold - MIN_DB) / (MAX_DB - MIN_DB)) * 100));
  const over = dbLevel > threshold;

  return (
    <div className="audio-bar-wrap">
      <span className="audio-label">Audio</span>
      <div className="audio-bar-track">
        <div
          className={`audio-bar-fill ${over ? 'over' : ''}`}
          style={{ width: `${pct}%` }}
        />
        <div className="audio-threshold" style={{ left: `${thresholdPct}%` }} />
      </div>
      <span className="audio-db">{isFinite(dbLevel) ? `${dbLevel.toFixed(0)} dB` : '—'}</span>
    </div>
  );
}
