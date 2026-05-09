import type { RefObject } from 'react';

function detectSupport(): { mimeType: string; ext: string } {
  for (const [mimeType, ext] of [
    ['audio/webm', 'webm'],
    ['audio/ogg', 'ogg'],
    ['audio/mp4', 'm4a'],
  ] as const) {
    if (MediaRecorder.isTypeSupported(mimeType)) return { mimeType, ext };
  }
  return { mimeType: '', ext: 'webm' };
}

const { mimeType: MIME_TYPE, ext: AUDIO_EXT } = detectSupport();

export function useAudioRecorder(streamRef: RefObject<MediaStream | null>) {
  function record(durationMs: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const stream = streamRef.current;
      if (!stream) { reject(new Error('No audio stream available')); return; }

      // Wrap in a new MediaStream so AudioContext consumers don't interfere
      const recordingStream = new MediaStream(stream.getAudioTracks());

      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(
          recordingStream,
          MIME_TYPE ? { mimeType: MIME_TYPE } : undefined,
        );
      } catch (err) {
        reject(err);
        return;
      }

      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => resolve(new Blob(chunks, { type: MIME_TYPE || 'audio/webm' }));
      recorder.onerror = (e) => reject(e);

      recorder.start();
      setTimeout(() => {
        if (recorder.state !== 'inactive') recorder.stop();
      }, durationMs);
    });
  }

  return { record, mimeType: MIME_TYPE, ext: AUDIO_EXT };
}
