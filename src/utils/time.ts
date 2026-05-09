export function nowIso(): string {
  return new Date().toISOString();
}

export function isoToFilename(iso: string): string {
  return iso.replace(/[:.]/g, '-');
}

export function timestampedPath(prefix: string, ext: string): string {
  return `${prefix}/${isoToFilename(nowIso())}.${ext}`;
}

export function isOlderThan(isoTime: string, ms: number): boolean {
  return Date.now() - new Date(isoTime).getTime() > ms;
}
