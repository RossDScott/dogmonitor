import { photoBlobUrl } from '../../services/azureBlob';

interface Props {
  sasUri: string;
  audioHistory: string[];
}

function clipLabel(path: string): string {
  const filename = path.split('/').pop() ?? path;
  const withoutExt = filename.replace(/\.[^.]+$/, '');
  const parts = withoutExt.split('T');
  if (parts.length < 2) return withoutExt;
  const timePart = parts[1].replace(/-/g, ':').replace(/\.\d+$/, '');
  return `${parts[0]} ${timePart}`;
}

export function AudioStrip({ sasUri, audioHistory }: Props) {
  if (audioHistory.length === 0) return null;

  return (
    <div className="audio-strip">
      <h3>Audio clips</h3>
      <ul className="audio-list">
        {[...audioHistory].reverse().map((path) => (
          <li key={path} className="audio-item">
            <span className="audio-label">{clipLabel(path)}</span>
            <audio controls preload="auto" src={photoBlobUrl(sasUri, path)} />
          </li>
        ))}
      </ul>
    </div>
  );
}
