import { useEffect } from 'react';
import type { MonitorEvent } from '../../types/status';

interface Props {
  events: MonitorEvent[];
  onDismiss: () => void;
}

function beep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch { /* ignore */ }
}

export function AlertBanner({ events, onDismiss }: Props) {
  const unacked = events.filter((e) => !e.acknowledged);
  if (unacked.length === 0) return null;

  useEffect(() => { beep(); }, [unacked.length]);

  const latest = unacked[unacked.length - 1];

  return (
    <div className="alert-banner">
      <div className="alert-content">
        <strong>
          {latest.type === 'noise' ? 'Noise detected' : 'Movement detected'}
        </strong>
        <span>{new Date(latest.time).toLocaleTimeString()}</span>
        {unacked.length > 1 && <span>+{unacked.length - 1} more</span>}
      </div>
      <button className="btn-dismiss" onClick={onDismiss}>
        Dismiss
      </button>
    </div>
  );
}
