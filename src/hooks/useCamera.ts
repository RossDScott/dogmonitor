import { useEffect, useRef, useState } from 'react';
import { compressVideoFrame } from '../utils/imageCompression';

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then((stream) => {
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setReady(true);
      })
      .catch((err) => setError(err.message));

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      setReady(false);
    };
  }, []);

  async function captureJpeg(quality = 0.65, maxWidth = 640): Promise<Blob> {
    if (!videoRef.current || !ready) throw new Error('Camera not ready');
    return compressVideoFrame(videoRef.current, maxWidth, quality);
  }

  return { videoRef, ready, error, captureJpeg };
}
