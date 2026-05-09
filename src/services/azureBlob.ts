function blobUrl(sasUri: string, path: string): string {
  const base = sasUri.replace(/\/$/, '');
  const [containerUrl, sas] = base.split('?');
  return `${containerUrl}/${path}?${sas}`;
}

export async function putBlob(
  sasUri: string,
  path: string,
  data: Blob | string,
  contentType: string,
): Promise<void> {
  const body = typeof data === 'string' ? new Blob([data], { type: contentType }) : data;
  const res = await fetch(blobUrl(sasUri, path), {
    method: 'PUT',
    headers: {
      'x-ms-blob-type': 'BlockBlob',
      'Content-Type': contentType,
    },
    body,
  });
  if (!res.ok) throw new Error(`PUT ${path} failed: ${res.status} ${await res.text()}`);
}

export async function getJson<T>(sasUri: string, path: string): Promise<T> {
  const res = await fetch(blobUrl(sasUri, path));
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export function photoBlobUrl(sasUri: string, path: string): string {
  return blobUrl(sasUri, path);
}
