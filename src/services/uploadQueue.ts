import { putBlob } from './azureBlob';
import { withRetry } from '../utils/retry';

interface QueueItem {
  path: string;
  data: Blob | string;
  contentType: string;
}

export interface QueueStatus {
  pending: number;
  lastError: string | null;
  lastSuccess: string | null;
}

type StatusListener = (s: QueueStatus) => void;

export class UploadQueue {
  private queue: QueueItem[] = [];
  private draining = false;
  private sasUri = '';
  private status: QueueStatus = { pending: 0, lastError: null, lastSuccess: null };
  private listeners: StatusListener[] = [];

  setSasUri(uri: string) {
    this.sasUri = uri;
  }

  enqueue(path: string, data: Blob | string, contentType: string) {
    const existing = this.queue.findIndex((i) => i.path === path);
    if (existing >= 0) {
      this.queue[existing] = { path, data, contentType };
    } else {
      this.queue.push({ path, data, contentType });
    }
    this.notify();
    this.drain();
  }

  onStatus(fn: StatusListener) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private notify() {
    this.status = { ...this.status, pending: this.queue.length };
    this.listeners.forEach((l) => l(this.status));
  }

  private async drain() {
    if (this.draining || this.queue.length === 0 || !this.sasUri) return;
    this.draining = true;
    while (this.queue.length > 0) {
      const item = this.queue[0];
      try {
        await withRetry(() => putBlob(this.sasUri, item.path, item.data, item.contentType));
        this.queue.shift();
        this.status.lastSuccess = new Date().toISOString();
        this.status.lastError = null;
      } catch (err) {
        this.status.lastError = err instanceof Error ? err.message : String(err);
        break;
      }
      this.notify();
    }
    this.draining = false;
    this.notify();
  }
}

export const uploadQueue = new UploadQueue();
