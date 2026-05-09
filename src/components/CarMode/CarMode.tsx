import { useEffect, useRef, useState } from 'react';
import type { AppConfig, MonitorEvent } from '../../types/status';
import { useWakeLock } from '../../hooks/useWakeLock';
import { useCamera } from '../../hooks/useCamera';
import { useAudio } from '../../hooks/useAudio';
import { useMotion } from '../../hooks/useMotion';
import { useGps } from '../../hooks/useGps';
import type { QueueStatus } from '../../services/uploadQueue';
import { uploadQueue } from '../../services/uploadQueue';
import { buildStatus } from '../../services/statusBuilder';
import { nowIso, timestampedPath } from '../../utils/time';
import { CameraView } from './CameraView';
import { AudioBar } from './AudioBar';
import { StatusBar } from './StatusBar';

interface Props {
  config: AppConfig;
  onSettings: () => void;
}

const ONE_HOUR = 60 * 60 * 1000;

export function CarMode({ config, onSettings }: Props) {
  const wakeLockHeld = useWakeLock(true);
  const { videoRef, ready: cameraReady, captureJpeg } = useCamera();
  const { dbLevel } = useAudio(true);
  const { magnitude } = useMotion(true);
  const { location } = useGps(true);

  const sessionStart = useRef(nowIso());
  const eventsRef = useRef<MonitorEvent[]>([]);
  const photoHistoryRef = useRef<string[]>([]);
  const latestPhotoRef = useRef<string | null>(null);
  const [lastCaptureUrl, setLastCaptureUrl] = useState<string | null>(null);
  const [queueStatus, setQueueStatus] = useState<QueueStatus>({
    pending: 0,
    lastError: null,
    lastSuccess: null,
  });

  const noiseStartRef = useRef<number | null>(null);
  const motionFiredRef = useRef<number>(0);

  useEffect(() => {
    uploadQueue.setSasUri(config.sasUri);
    return uploadQueue.onStatus(setQueueStatus);
  }, [config.sasUri]);

  function addEvent(type: MonitorEvent['type'], level: number) {
    eventsRef.current = [
      ...eventsRef.current.filter((e) => Date.now() - new Date(e.time).getTime() < ONE_HOUR),
      {
        id: crypto.randomUUID(),
        type,
        time: nowIso(),
        level,
        acknowledged: false,
      },
    ];
  }

  async function captureAndEnqueue(triggerType?: string) {
    if (!cameraReady) return null;
    try {
      const blob = await captureJpeg();
      const path = timestampedPath(triggerType ? `photos/trigger-${triggerType}` : 'photos', 'jpg');
      uploadQueue.enqueue(path, blob, 'image/jpeg');
      photoHistoryRef.current = [...photoHistoryRef.current.slice(-59), path];
      latestPhotoRef.current = path;
      const url = URL.createObjectURL(blob);
      setLastCaptureUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return url; });
      return path;
    } catch { return null; }
  }

  function uploadStatus() {
    const status = buildStatus(
      sessionStart.current,
      location,
      latestPhotoRef.current,
      photoHistoryRef.current,
      eventsRef.current,
    );
    uploadQueue.enqueue('status.json', JSON.stringify(status), 'application/json');
  }

  // Periodic photo + status upload
  useEffect(() => {
    if (!cameraReady) return;
    async function loop() {
      await captureAndEnqueue();
      uploadStatus();
    }
    loop();
    const id = setInterval(loop, config.photoIntervalSec * 1000);
    return () => clearInterval(id);
  }, [cameraReady, config.photoIntervalSec]);

  // Audio monitoring
  useEffect(() => {
    if (dbLevel > config.noiseThresholdDb) {
      if (noiseStartRef.current === null) noiseStartRef.current = Date.now();
      else if (Date.now() - noiseStartRef.current > 2000) {
        noiseStartRef.current = null;
        addEvent('noise', dbLevel);
        captureAndEnqueue('noise').then(() => uploadStatus());
      }
    } else {
      noiseStartRef.current = null;
    }
  }, [dbLevel]);

  // Motion monitoring
  useEffect(() => {
    if (magnitude > config.motionThresholdMs2) {
      const now = Date.now();
      if (now - motionFiredRef.current > 5000) {
        motionFiredRef.current = now;
        addEvent('motion', magnitude);
        uploadStatus();
      }
    }
  }, [magnitude]);

  return (
    <div className="car-mode">
      <div className="mode-header">
        <h2>Car Mode</h2>
        <button className="btn-icon" onClick={onSettings}>Settings</button>
      </div>
      <StatusBar
        queueStatus={queueStatus}
        wakeLockHeld={wakeLockHeld}
        eventCount={eventsRef.current.length}
        location={location}
      />
      <CameraView videoRef={videoRef} lastCapture={lastCaptureUrl} />
      <AudioBar dbLevel={dbLevel} threshold={config.noiseThresholdDb} />
      <div className="sensor-row">
        <span>Motion: {magnitude.toFixed(2)} m/s²</span>
        {location && (
          <span>GPS: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>
        )}
      </div>
    </div>
  );
}
