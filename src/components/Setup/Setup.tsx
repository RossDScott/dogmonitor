import { useState } from 'react';
import type { AppConfig } from '../../types/status';
import { CONFIG_KEY, DEFAULT_CONFIG } from '../../types/status';

interface Props {
  onSave: (config: AppConfig) => void;
  initial?: AppConfig;
}

export function Setup({ onSave, initial }: Props) {
  const [sasUri, setSasUri] = useState(initial?.sasUri ?? '');
  const [mode, setMode] = useState<'car' | 'person'>(initial?.mode ?? 'car');
  const [photoInterval, setPhotoInterval] = useState(
    initial?.photoIntervalSec ?? DEFAULT_CONFIG.photoIntervalSec,
  );
  const [noiseThreshold, setNoiseThreshold] = useState(
    initial?.noiseThresholdDb ?? DEFAULT_CONFIG.noiseThresholdDb,
  );
  const [motionThreshold, setMotionThreshold] = useState(
    initial?.motionThresholdMs2 ?? DEFAULT_CONFIG.motionThresholdMs2,
  );
  const [syncInterval, setSyncInterval] = useState(
    initial?.syncIntervalSec ?? DEFAULT_CONFIG.syncIntervalSec,
  );

  function save() {
    if (!sasUri.trim()) return;
    const config: AppConfig = {
      sasUri: sasUri.trim(),
      mode,
      photoIntervalSec: photoInterval,
      noiseThresholdDb: noiseThreshold,
      motionThresholdMs2: motionThreshold,
      syncIntervalSec: syncInterval,
    };
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    onSave(config);
  }

  return (
    <div className="setup">
      <h1>DogMonitor</h1>
      <p className="setup-sub">Configure before starting</p>

      <label>
        Azure SAS URI
        <input
          type="url"
          value={sasUri}
          onChange={(e) => setSasUri(e.target.value)}
          placeholder="https://account.blob.core.windows.net/container?sv=..."
        />
      </label>

      <label>Mode</label>
      <div className="mode-toggle">
        <button
          className={mode === 'car' ? 'active' : ''}
          onClick={() => setMode('car')}
        >
          Car (leave in boot)
        </button>
        <button
          className={mode === 'person' ? 'active' : ''}
          onClick={() => setMode('person')}
        >
          Person (keep with you)
        </button>
      </div>

      {mode === 'car' && (
        <>
          <label>
            Photo interval (seconds)
            <input
              type="number"
              min={10}
              max={600}
              value={photoInterval}
              onChange={(e) => setPhotoInterval(Number(e.target.value))}
            />
          </label>
          <label>
            Noise threshold (dBFS, e.g. -30)
            <input
              type="range"
              min={-60}
              max={-10}
              step={1}
              value={noiseThreshold}
              onChange={(e) => setNoiseThreshold(Number(e.target.value))}
            />
            <span>{noiseThreshold} dBFS</span>
          </label>
          <label>
            Motion threshold (m/s²)
            <input
              type="number"
              min={0.5}
              max={20}
              step={0.5}
              value={motionThreshold}
              onChange={(e) => setMotionThreshold(Number(e.target.value))}
            />
          </label>
        </>
      )}

      {mode === 'person' && (
        <label>
          Sync interval (seconds)
          <input
            type="number"
            min={10}
            max={300}
            value={syncInterval}
            onChange={(e) => setSyncInterval(Number(e.target.value))}
          />
        </label>
      )}

      <button className="btn-primary" onClick={save} disabled={!sasUri.trim()}>
        Start
      </button>
    </div>
  );
}
