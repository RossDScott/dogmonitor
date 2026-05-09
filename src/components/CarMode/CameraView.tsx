import type { RefObject } from 'react';

interface Props {
  videoRef: RefObject<HTMLVideoElement | null>;
  lastCapture: string | null;
}

export function CameraView({ videoRef, lastCapture }: Props) {
  return (
    <div className="camera-view">
      <video ref={videoRef} muted playsInline className="camera-live" />
      {lastCapture && (
        <div className="camera-last">
          <span className="camera-last-label">Last upload</span>
          <img src={lastCapture} alt="Last capture" />
        </div>
      )}
    </div>
  );
}
