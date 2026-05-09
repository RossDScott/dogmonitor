import type { MonitorEvent } from '../../types/status';
import { photoBlobUrl } from '../../services/azureBlob';

interface Props {
  events: MonitorEvent[];
  sasUri: string;
}

const LABELS: Record<MonitorEvent['type'], string> = {
  noise: 'Noise',
  motion: 'Movement',
};

export function EventLog({ events, sasUri }: Props) {
  if (events.length === 0) return <p className="no-events">No events in the last hour</p>;

  return (
    <div className="event-log">
      <h3>Events (last hour)</h3>
      <ul>
        {[...events].reverse().map((e) => (
          <li key={e.id} className={`event-item ${e.type} ${e.acknowledged ? 'acked' : 'unacked'}`}>
            <span className="event-type">{LABELS[e.type]}</span>
            <span className="event-level">{e.level.toFixed(1)}</span>
            <span className="event-time">{new Date(e.time).toLocaleTimeString()}</span>
            {e.audioClip && (
              <audio
                controls
                src={photoBlobUrl(sasUri, e.audioClip)}
                className="event-audio"
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
