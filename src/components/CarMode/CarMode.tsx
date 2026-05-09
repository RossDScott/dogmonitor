import { useEffect, useRef, useState } from 'react';
import type { AppConfig, MonitorEvent } from '../../types/status';
import { useWakeLock } from '../../hooks/useWakeLock';
import { useCamera } from '../../hooks/useCamera';
import { useAudio } from '../../hooks/useAudio';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
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
  const { dbLevel, streamRef: audioStreamRef } = useAudio(true);
  const { record: recordAudio, mimeType: audioMimeType, ext: audioExt } = useAudioRecorder(audioStreamRef);
  const { magnitude } = useMotion(true);
  const { location } = useGps(true);

  const sessionStart = useRef(nowIso());
  const eventsRef = useRef<MonitorEvent[]>([]);
  const photoHistoryRef = useRef<string[]>([]);
  const audioHistoryRef = useRef<string[]>([]);
  const latestPhotoRef = useRef<string | null>(null);
  const [lastCaptureUrl, setLastCaptureUrl] = useState<string | null>(null);
  const [queueStatus, setQueueStatus] = useState<QueueStatus>({
    pending: 0,
    lastError: null,
    lastSuccess: null,
  });

  const noiseStartRef = useRef<number | null>(null);
  const motionFiredRef = useRef<number>(0);
  const recordingRef = useRef(false);
  const [recordingStatus, setRecordingStatus] = useState<'idle' | 'recording' | 'done' | 'failed'>('idle');
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    uploadQueue.setSasUri(config.sasUri);
    return uploadQueue.onStatus(setQueueStatus);
  }, [config.sasUri]);

  function addEvent(type: MonitorEvent['type'], level: number): string {
    const id = crypto.randomUUID();
    eventsRef.current = [
      ...eventsRef.current.filter((e) => Date.now() - new Date(e.time).getTime() < ONE_HOUR),
      { id, type, time: nowIso(), level, acknowledged: false },
    ];
    return id;
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
      audioHistoryRef.current,
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
        const eventId = addEvent('noise', dbLevel);
        captureAndEnqueue('noise').then(() => uploadStatus());
        if (!recordingRef.current) {
          recordingRef.current = true;
          setRecordingStatus('recording');
          recordAudio(10_000).then((audioBlob) => {
            const audioPath = timestampedPath('audio/trigger-noise', audioExt);
            uploadQueue.enqueue(audioPath, audioBlob, audioMimeType || 'audio/webm');
            audioHistoryRef.current = [...audioHistoryRef.current.slice(-19), audioPath];
            eventsRef.current = eventsRef.current.map((e) =>
              e.id === eventId ? { ...e, audioClip: audioPath } : e,
            );
            uploadStatus();
            setRecordingStatus('done');
            setTimeout(() => setRecordingStatus('idle'), 3000);
          }).catch((err) => {
            console.error('Audio recording failed:', err);
            setRecordingStatus('failed');
            setTimeout(() => setRecordingStatus('idle'), 5000);
          }).finally(() => {
            recordingRef.current = false;
          });
        }
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
      {hidden && <div className="car-mode-blackout" onClick={() => setHidden(false)} />}
      <div className="mode-header">
        <h2>Car Mode <span className="app-version">v{__APP_VERSION__}</span></h2>
        <button className="btn-icon" onClick={() => setHidden(true)}>Hide</button>
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
      {recordingStatus !== 'idle' && (
        <div className={`recording-status recording-status--${recordingStatus}`}>
          {recordingStatus === 'recording' && 'Recording audio...'}
          {recordingStatus === 'done' && 'Audio clip saved'}
          {recordingStatus === 'failed' && 'Audio recording failed'}
        </div>
      )}
      <div className="sensor-row">
        <span>Motion: {magnitude.toFixed(2)} m/s²</span>
        {location && (
          <span>GPS: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>
        )}
      </div>
    </div>
  );
}
