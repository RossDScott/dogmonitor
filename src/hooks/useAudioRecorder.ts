import type { RefObject } from 'react';

export function useAudioRecorder(streamRef: RefObject<MediaStream | null>) {
  function record(durationMs: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const stream = streamRef.current;
      if (!stream) { reject(new Error('No audio stream available')); return; }

      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/ogg')
        ? 'audio/ogg'
        : '';

      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      } catch (err) {
        reject(err);
        return;
      }

      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType || 'audio/webm' }));
      recorder.onerror = (e) => reject(e);

      recorder.start();
      setTimeout(() => {
        if (recorder.state !== 'inactive') recorder.stop();
      }, durationMs);
    });
  }

  return { record };
}
